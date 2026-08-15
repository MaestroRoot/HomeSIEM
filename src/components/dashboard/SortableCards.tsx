import type { ReactNode } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, EyeOff, GripVertical, RotateCcw } from 'lucide-react'
import { useCustomize } from '@/context/CustomizeContext'
import { orderCards, usePageLayout } from '@/lib/usePageLayout'
import { cx } from '../ui'

export interface CardDef {
  id: string
  node: ReactNode
  /** default column span on large screens */
  span?: number
  /** short label used in the hidden-cards panel */
  label?: string
}

const SPAN_CLASS: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
}

/**
 * A per-page grid whose cards can be reordered (drag), resized (column span) and
 * hidden/restored by the user. All state lives in localStorage under
 * `homesiem.layout.<pageKey>` — no backend calls. Card order never crosses pages.
 */
export default function SortableCardGrid({
  pageKey,
  cols,
  maxCols = 4,
  className,
  cards,
}: {
  pageKey: string
  cols: string
  maxCols?: number
  className?: string
  cards: CardDef[]
}) {
  const { editing } = useCustomize()
  const { cfg, reorder, toggleHidden, setSpan, reset } = usePageLayout(pageKey)

  const visible = cards.filter((c) => !cfg.hidden.includes(c.id))
  const ordered = orderCards(visible, cfg.order)

  // Read-only (default) view — pure CSS, no drag-and-drop overhead.
  if (!editing) {
    return (
      <div className={cx('grid gap-4', cols, className)}>
        {ordered.map((c) => (
          <div key={c.id} className={SPAN_CLASS[cfg.spans[c.id] ?? c.span ?? 1] ?? ''}>
            {c.node}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <EditToolbar hasHidden={cfg.hidden.length > 0} onReset={reset} />
      <DndContainer
        items={ordered}
        cols={cols}
        className={className}
        maxCols={maxCols}
        spans={cfg.spans}
        onDragEnd={(activeId, overId) => reorder(activeId, overId, visible.map((c) => c.id))}
        onToggle={toggleHidden}
        onSpan={setSpan}
      />
      {cfg.hidden.length > 0 && (
        <HiddenPanel cards={cards} hidden={cfg.hidden} onRestore={toggleHidden} />
      )}
    </div>
  )
}

function DndContainer({
  items,
  cols,
  className,
  maxCols,
  spans,
  onDragEnd,
  onToggle,
  onSpan,
}: {
  items: CardDef[]
  cols: string
  className?: string
  maxCols: number
  spans: Record<string, number>
  onDragEnd: (activeId: string, overId: string) => void
  onToggle: (id: string) => void
  onSpan: (id: string, span: number) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    onDragEnd(String(active.id), String(over.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className={cx('grid gap-4', cols, className)}>
          {items.map((c) => (
            <SortableItem
              key={c.id}
              def={c}
              maxCols={maxCols}
              span={spans[c.id] ?? c.span ?? 1}
              onToggle={() => onToggle(c.id)}
              onSpan={(n) => onSpan(c.id, n)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableItem({
  def,
  maxCols,
  span,
  onToggle,
  onSpan,
}: {
  def: CardDef
  maxCols: number
  span: number
  onToggle: () => void
  onSpan: (n: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: def.id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx(
        'relative',
        SPAN_CLASS[Math.min(span, maxCols)] ?? '',
        isDragging && 'z-20 opacity-60',
      )}
    >
      {def.node}
      <div className="absolute -top-3 left-3 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-0.5 shadow-sm">
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          className="grid h-6 w-6 cursor-grab place-items-center rounded-full text-slate-500 hover:bg-slate-100 active:cursor-grabbing"
        >
          <GripVertical size={13} />
        </button>
        <button
          type="button"
          onClick={() => onSpan(span >= maxCols ? 1 : span + 1)}
          title="Resize (cycle column span)"
          className="grid h-6 min-w-6 place-items-center rounded-full px-1 font-mono text-[10px] font-bold text-slate-500 hover:bg-slate-100"
        >
          {span}/{maxCols}
        </button>
        <button
          type="button"
          onClick={onToggle}
          title="Hide card"
          className="grid h-6 w-6 place-items-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600"
        >
          <EyeOff size={13} />
        </button>
      </div>
    </div>
  )
}

function EditToolbar({ hasHidden, onReset }: { hasHidden: boolean; onReset: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500">
      <span>
        Edit mode — drag <GripVertical size={11} className="inline" /> to reorder, use the{' '}
        <span className="font-mono font-bold">1/N</span> button to resize,{' '}
        <EyeOff size={11} className="inline" /> to hide.
      </span>
      {hasHidden && <span className="text-slate-400">{hasHidden ? 'Hidden cards appear below.' : ''}</span>}
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-600 hover:border-red-200 hover:text-red-600"
      >
        <RotateCcw size={11} /> Reset layout
      </button>
    </div>
  )
}

function HiddenPanel({
  cards,
  hidden,
  onRestore,
}: {
  cards: CardDef[]
  hidden: string[]
  onRestore: (id: string) => void
}) {
  const gone = cards.filter((c) => hidden.includes(c.id))
  if (gone.length === 0) return null
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">Hidden cards</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {gone.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onRestore(c.id)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-brand-300 hover:text-brand-700"
          >
            <Eye size={12} /> {c.label ?? c.id}
          </button>
        ))}
      </div>
    </div>
  )
}
