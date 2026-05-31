const { PrismaClient } = require('@prisma/client')
const bcrypt  = require('bcrypt')
const jwt     = require('jsonwebtoken')
const prisma  = new PrismaClient()

// ─── Login (email/senha) ───────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, senha } = req.body
    const usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario) return res.status(401).json({ mensagem: 'Credenciais inválidas' })
    if (!usuario.senha) return res.status(401).json({ mensagem: 'Esta conta usa login com Google. Clique em "Entrar com Google".' })

    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    if (!senhaValida) return res.status(401).json({ mensagem: 'Credenciais inválidas' })

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '8h' })
    res.json({ token })
  } catch (erro) {
    console.error('Erro no login:', erro)
    res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
  }
}

// ─── Cadastro (email/senha) ────────────────────────────────────────────────
async function cadastrar(req, res) {
  try {
    const { nome, email, senha } = req.body
    if (!nome || !email || !senha) return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios.' })
    if (senha.length < 6) return res.status(400).json({ mensagem: 'A senha precisa ter pelo menos 6 caracteres.' })

    const existente = await prisma.usuario.findUnique({ where: { email } })
    if (existente) return res.status(409).json({ mensagem: 'Este email já está cadastrado.' })

    const senhaCriptografada = await bcrypt.hash(senha, 10)
    await prisma.usuario.create({ data: { nome, email, senha: senhaCriptografada } })
    res.status(201).json({ mensagem: 'Conta criada com sucesso! Faça login para continuar.' })
  } catch (erro) {
    console.error('Erro no cadastro:', erro)
    res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
  }
}

// ─── Callback Google OAuth ─────────────────────────────────────────────────
async function googleCallback(req, res) {
  try {
    const { id: google_id, displayName: nome, emails } = req.user
    const email = emails[0].value

    let usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario) {
      usuario = await prisma.usuario.create({ data: { nome, email, google_id } })
    } else if (!usuario.google_id) {
      await prisma.usuario.update({ where: { id: usuario.id }, data: { google_id } })
    }

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '8h' })
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`)
  } catch (erro) {
    console.error('Erro no callback Google:', erro)
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${FRONTEND_URL}/auth/callback?erro=Erro+ao+autenticar+com+Google`)
  }
}

module.exports = { login, cadastrar, googleCallback }