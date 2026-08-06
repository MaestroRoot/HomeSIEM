#!/usr/bin/env python3
"""HomeSIEM NextDNS bridge.

Inavuta DNS query logs kutoka NextDNS (whole-home DNS visibility bila kuendesha
resolver nyumbani) na kuzituma HomeSIEM kama DNS events. Endesha popote penye
internet (server, Raspberry Pi, PC inayowaka daima).

Inahitaji env 4:
    HOMESIEM_URL            = https://homesiem.167.99.134.27.sslip.io/api/v1
    HOMESIEM_SENSOR_TOKEN   = hs_xxxxx   (kutoka Agents page)
    NEXTDNS_API_KEY         = kutoka my.nextdns.io/account (sehemu ya API)
    NEXTDNS_PROFILE_ID      = herufi za profile, mfano a1b2c3

Endesha (PowerShell):
    $env:HOMESIEM_URL="..."; $env:HOMESIEM_SENSOR_TOKEN="hs_..."
    $env:NEXTDNS_API_KEY="..."; $env:NEXTDNS_PROFILE_ID="a1b2c3"
    python nextdns.py
"""

from __future__ import annotations

import json
import os
import ssl
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

NEXTDNS_BASE = "https://api.nextdns.io"
POLL_SECONDS = 15
LOG_LIMIT = 100
_SEEN_MAX = 2000

_INSECURE_CTX: "ssl.SSLContext | None" = None


def _urlopen(req: urllib.request.Request, timeout: int = 30):
    """CA store ya zamani -> cheti kinaonekana 'expired'. Rudi bila uthibitisho
    (server ya mtumiaji + token/api-key ndio ulinzi) badala ya kushindwa."""
    global _INSECURE_CTX
    try:
        return urllib.request.urlopen(req, timeout=timeout)
    except urllib.error.URLError as exc:
        reason = getattr(exc, "reason", None)
        if isinstance(reason, ssl.SSLError) or isinstance(exc, ssl.SSLError):
            if _INSECURE_CTX is None:
                _INSECURE_CTX = ssl.create_default_context()
                _INSECURE_CTX.check_hostname = False
                _INSECURE_CTX.verify_mode = ssl.CERT_NONE
            return urllib.request.urlopen(req, timeout=timeout, context=_INSECURE_CTX)
        raise


def _to_ts(iso: str | None) -> float:
    if not iso:
        return datetime.now(timezone.utc).timestamp()
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).timestamp()
    except ValueError:
        return datetime.now(timezone.utc).timestamp()


def fetch_logs(profile: str, api_key: str) -> list[dict]:
    req = urllib.request.Request(
        f"{NEXTDNS_BASE}/profiles/{profile}/logs?limit={LOG_LIMIT}",
        headers={"X-Api-Key": api_key},
        method="GET",
    )
    with _urlopen(req) as r:
        payload = json.loads(r.read())
    data = payload.get("data") if isinstance(payload, dict) else payload
    return data if isinstance(data, list) else []


def post_events(url: str, token: str, events: list[dict]) -> None:
    req = urllib.request.Request(
        url.rstrip("/") + "/ingest/events",
        data=json.dumps({"events": events}).encode(),
        headers={"Content-Type": "application/json", "X-Sensor-Token": token},
        method="POST",
    )
    try:
        with _urlopen(req) as r:
            res = json.loads(r.read())
            print(f"   -> HomeSIEM: {res.get('accepted')} sent, {res.get('flagged')} flagged", flush=True)
    except (urllib.error.URLError, OSError, ValueError) as exc:
        print(f"   -> HomeSIEM error: {exc}", flush=True)


def main() -> None:
    url = os.environ.get("HOMESIEM_URL", "").strip()
    token = os.environ.get("HOMESIEM_SENSOR_TOKEN", "").strip()
    api_key = os.environ.get("NEXTDNS_API_KEY", "").strip()
    profile = os.environ.get("NEXTDNS_PROFILE_ID", "").strip()
    if not all((url, token, api_key, profile)):
        raise SystemExit(
            "Weka env zote 4: HOMESIEM_URL, HOMESIEM_SENSOR_TOKEN, NEXTDNS_API_KEY, NEXTDNS_PROFILE_ID"
        )

    print(f"HomeSIEM NextDNS bridge. Profile={profile}. Inavuta logs kila {POLL_SECONDS}s. Ctrl+C kusimama.\n")
    seen: set[str] = set()
    first_run = True
    try:
        while True:
            try:
                logs = fetch_logs(profile, api_key)
            except (urllib.error.URLError, OSError, ValueError) as exc:
                print(f"NextDNS fetch error: {exc}", flush=True)
                time.sleep(POLL_SECONDS)
                continue

            fresh = []
            for entry in logs:
                domain = (entry.get("domain") or "").strip()
                if not domain:
                    continue
                key = f"{entry.get('timestamp')}|{domain}|{entry.get('clientIp')}"
                if key in seen:
                    continue
                seen.add(key)
                fresh.append(
                    {
                        "kind": "dns",
                        "srcIp": entry.get("clientIp") or None,
                        "domain": domain,
                        "ts": _to_ts(entry.get("timestamp")),
                    }
                )

            # Mara ya kwanza: usirudishe historia yote — weka alama tu.
            if first_run:
                first_run = False
                print(f"   (imeanzishwa; imeruka {len(fresh)} za zamani)", flush=True)
            elif fresh:
                post_events(url, token, fresh[:400])

            if len(seen) > _SEEN_MAX:
                seen = set(list(seen)[-_SEEN_MAX // 2 :])
            time.sleep(POLL_SECONDS)
    except KeyboardInterrupt:
        print("\nImesimama.")


if __name__ == "__main__":
    main()
