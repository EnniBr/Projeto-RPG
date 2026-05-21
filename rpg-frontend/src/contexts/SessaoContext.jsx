import { createContext, useContext, useState } from 'react'

const SessaoContext = createContext(null)

export function SessaoProvider({ children }) {
  const [sessaoAtiva, setSessaoAtiva] = useState(null)

  return (
    <SessaoContext.Provider value={{ sessaoAtiva, setSessaoAtiva }}>
      {children}
    </SessaoContext.Provider>
  )
}

export function useSessao() {
  return useContext(SessaoContext)
}