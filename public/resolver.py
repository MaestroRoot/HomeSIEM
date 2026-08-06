#!/usr/bin/env python3
"""HomeSIEM, DNS resolver ya majaribio (sensor).

Inasikiliza DNS (UDP), inaandika KILA swali (nani ameuliza + domain), kisha
ina-forward kwa upstream halisi ili kifaa kibaki na internet. Kwa hiari,
inatuma matukio kwa HomeSIEM (`/ingest/events`) kama sensor token ipo.

Haina dependency yoyote ya nje, stdlib pekee.

Matumizi:
    python resolver.py                 # port 53, inaandika console pekee
    python resolver.py --port 5353     # port mwingine (bila admin)
    # Kutuma HomeSIEM pia:
    set HOMESIEM_URL=http://localhost:8000/api/v1
    set HOMESIEM_SENSOR_TOKEN=hs_xxxxx
    python resolver.py

Lengo la jaribio hili: weka IP ya PC hii kama DNS kwenye simu, kisha tazama
hapa. Ukiweka DNS mbili kwenye simu, utaona kama maswali YOTE yanafika hapa
au baadhi yanavuja kwenye ile nyingine.
"""

from __future__ import annotations

import argparse
import json
import os
import queue
import socket
import struct
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

UPSTREAM = ("1.1.1.1", 53)
_QTYPE = {1: "A", 28: "AAAA", 5: "CNAME", 15: "MX", 16: "TXT", 2: "NS", 12: "PTR", 33: "SRV", 65: "HTTPS"}

# Foleni ya matukio ya kutuma HomeSIEM (thread ya nyuma inaiflush).
_outbox: "queue.Queue[dict]" = queue.Queue()


def parse_question(data: bytes) -> tuple[str | None, int | None]:
    """Toa jina la domain na aina kutoka kwenye swali la DNS."""
    try:
        idx = 12  # ruka header ya bytes 12
        labels: list[str] = []
        while True:
            length = data[idx]
            if length == 0:
                idx += 1
                break
            labels.append(data[idx + 1 : idx + 1 + length].decode("utf-8", "replace"))
            idx += 1 + length
        qtype = struct.unpack("!H", data[idx : idx + 2])[0]
        return ".".join(labels), qtype
    except Exception:
        return None, None


def handle(data: bytes, client: tuple[str, int], sock: socket.socket, report: bool) -> None:
    domain, qtype = parse_question(data)
    stamp = datetime.now().strftime("%H:%M:%S")
    qname = _QTYPE.get(qtype or 0, str(qtype))
    print(f"{stamp}  {client[0]:15}  {domain or '?':40}  {qname}", flush=True)

    if report and domain:
        _outbox.put(
            {
                "kind": "dns",
                "srcIp": client[0],
                "domain": domain,
                "ts": datetime.now(timezone.utc).timestamp(),
            }
        )

    # Forward raw kwa upstream, rudisha jibu lake kama lilivyo.
    try:
        up = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        up.settimeout(5)
        up.sendto(data, UPSTREAM)
        resp, _ = up.recvfrom(4096)
        up.close()
        sock.sendto(resp, client)
    except OSError as exc:
        print(f"          upstream error: {exc}", flush=True)


def reporter(base_url: str, token: str) -> None:
    """Thread ya nyuma: inakusanya matukio na kuyatuma HomeSIEM kila sekunde 3."""
    url = base_url.rstrip("/") + "/ingest/events"
    while True:
        time.sleep(3)
        batch: list[dict] = []
        while not _outbox.empty() and len(batch) < 400:
            batch.append(_outbox.get())
        if not batch:
            continue
        body = json.dumps({"events": batch}).encode()
        req = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json", "X-Sensor-Token": token},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                res = json.loads(resp.read())
                print(
                    f"          -> HomeSIEM: {res.get('accepted')} sent, "
                    f"{res.get('flagged')} flagged",
                    flush=True,
                )
        except (urllib.error.URLError, OSError, ValueError) as exc:
            print(f"          -> HomeSIEM error: {exc}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=53)
    parser.add_argument("--upstream", default="1.1.1.1")
    args = parser.parse_args()

    global UPSTREAM
    UPSTREAM = (args.upstream, 53)

    base_url = os.environ.get("HOMESIEM_URL", "").strip()
    token = os.environ.get("HOMESIEM_SENSOR_TOKEN", "").strip()
    report = bool(base_url and token)

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(("0.0.0.0", args.port))

    print(f"HomeSIEM resolver, inasikiliza 0.0.0.0:{args.port}, upstream {UPSTREAM[0]}")
    if report:
        print(f"Inatuma HomeSIEM: {base_url}")
        threading.Thread(target=reporter, args=(base_url, token), daemon=True).start()
    else:
        print("HomeSIEM reporting imezimwa (weka HOMESIEM_URL na HOMESIEM_SENSOR_TOKEN kuiwasha).")
    print("Kila swali litaonekana hapa chini. Ctrl+C kusimamisha.\n")
    print(f"{'time':8}  {'client':15}  {'domain':40}  type")
    print("-" * 78)

    try:
        while True:
            data, client = sock.recvfrom(4096)
            threading.Thread(target=handle, args=(data, client, sock, report), daemon=True).start()
    except KeyboardInterrupt:
        print("\nImesimama.")


if __name__ == "__main__":
    main()
