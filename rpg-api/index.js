const express    = require('express')
const cors       = require('cors')
const http       = require('http')
const socketManager = require('./socket')

const app = express()
const httpServer = http.createServer(app)
socketManager.init(httpServer)

// ── Middlewares ──
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
app.use(cors({ origin: FRONTEND_URL }))
app.use(express.json())

if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static('uploads'))
}

// ── Rotas ──
app.get('/', (req, res) => res.json({ mensagem: 'API RPG funcionando!' }))

const usuariosRoutes       = require('./routes/usuarios')
const personagensRoutes    = require('./routes/personagens')
const atributosRoutes      = require('./routes/atributos')
const poderesRoutes        = require('./routes/poderes')
const sessoesRoutes        = require('./routes/sessoes')
const authRoutes           = require('./routes/auth')
const personagemPericiaRoutes  = require('./routes/personagempericias')
const personagemVantagemRoutes = require('./routes/personagemvantagens')
const fotosRoutes          = require('./routes/fotosRoutes')

app.use('/usuarios',   usuariosRoutes)
app.use('/personagens', personagensRoutes)
app.use('/atributos',  atributosRoutes)
app.use('/poderes',    poderesRoutes)
app.use('/sessoes',    sessoesRoutes)
app.use('/auth',       authRoutes)
app.use('/personagens/:personagemId/pericias',  personagemPericiaRoutes)
app.use('/personagens/:personagemId/vantagens', personagemVantagemRoutes)
app.use('/personagens', fotosRoutes)

// ── Servidor ──
const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))