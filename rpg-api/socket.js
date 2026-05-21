let io = null

function init(httpServer) {
  const { Server } = require('socket.io')  // ← adiciona essa linha
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
  io = new Server(httpServer, {
    cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] }
  })

  io.on('connection', (socket) => {
    socket.on('join-session', (sessaoId) => {
      socket.join(`sessao-${sessaoId}`)
    })

    socket.on('dice-roll', ({ sessao_id, ...rollData }) => {
      socket.to(`sessao-${sessao_id}`).emit('dice-roll-resultado', rollData)
    })
  })

  return io
}

function getIO() {
  if (!io) throw new Error('Socket.io não foi inicializado')
  return io
}

module.exports = { init, getIO }