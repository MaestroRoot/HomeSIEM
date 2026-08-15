import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface CustomizeCtx {
  editing: boolean
  setEditing: (v: boolean) => void
}

const Ctx = createContext<CustomizeCtx | null>(null)

export function CustomizeProvider({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState(false)
  const value = useMemo(() => ({ editing, setEditing }), [editing])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCustomize(): CustomizeCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCustomize must be used inside <CustomizeProvider>')
  return ctx
}
