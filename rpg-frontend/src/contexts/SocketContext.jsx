import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

    const s = io(URL, {
      transports: ['websocket', 'polling'],
    })

    s.on('connect',    () => console.log('Socket.io conectado:', s.id))
    s.on('disconnect', () => console.log('Socket.io desconectado'))

    setSocket(s)
    return () => s.disconnect()
  }, [])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}