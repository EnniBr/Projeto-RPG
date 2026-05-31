const { PrismaClient } = require('@prisma/client')
const bcrypt  = require('bcrypt')
const jwt     = require('jsonwebtoken')
const crypto  = require('crypto')
const prisma  = new PrismaClient()
const { enviarEmailVerificacao, enviarEmailResetSenha } = require('../services/email')

// ─── Helper: gerar token aleatório ────────────────────────────────────────
function gerarToken() {
  return crypto.randomBytes(32).toString('hex')
}

// ─── Login ─────────────────────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, senha } = req.body

    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas' })
    }

    if (!usuario.senha) {
      return res.status(401).json({ mensagem: 'Esta conta usa login com Google. Clique em "Entrar com Google".' })
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    if (!senhaValida) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas' })
    }

    if (!usuario.email_verificado) {
      return res.status(403).json({
        mensagem: 'Email não verificado. Verifique sua caixa de entrada.',
        email_nao_verificado: true,
        email: usuario.email,
      })
    }

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '8h' })
    res.json({ token })
  } catch (erro) {
    console.error('Erro no login:', erro)
    res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
  }
}

// ─── Cadastro ──────────────────────────────────────────────────────────────
async function cadastrar(req, res) {
  try {
    const { nome, email, senha } = req.body

    if (!nome || !email || !senha) {
      return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios.' })
    }
    if (senha.length < 6) {
      return res.status(400).json({ mensagem: 'A senha precisa ter pelo menos 6 caracteres.' })
    }

    const existente = await prisma.usuario.findUnique({ where: { email } })
    if (existente) {
      return res.status(409).json({ mensagem: 'Este email já está cadastrado.' })
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10)
    const token              = gerarToken()

    await prisma.usuario.create({
      data: {
        nome,
        email,
        senha:             senhaCriptografada,
        email_verificado:  false,
        token_verificacao: token,
      }
    })

    await enviarEmailVerificacao(email, nome, token)

    res.status(201).json({
      mensagem: 'Conta criada! Verifique seu email para ativar a conta.',
    })
  } catch (erro) {
    console.error('Erro no cadastro:', erro)
    res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
  }
}

// ─── Verificar email ────────────────────────────────────────────────────────
async function verificarEmail(req, res) {
  try {
    const { token } = req.query

    if (!token) {
      return res.status(400).json({ mensagem: 'Token não fornecido.' })
    }

    const usuario = await prisma.usuario.findFirst({
      where: { token_verificacao: token }
    })

    if (!usuario) {
      return res.status(400).json({ mensagem: 'Token inválido ou já utilizado.' })
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        email_verificado:  true,
        token_verificacao: null,
      }
    })

    res.json({ mensagem: 'Email verificado com sucesso! Você já pode fazer login.' })
  } catch (erro) {
    console.error('Erro ao verificar email:', erro)
    res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
  }
}

// ─── Reenviar verificação ──────────────────────────────────────────────────
async function reenviarVerificacao(req, res) {
  try {
    const { email } = req.body

    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) {
      return res.json({ mensagem: 'Se o email existir, você receberá um novo link.' })
    }

    if (usuario.email_verificado) {
      return res.status(400).json({ mensagem: 'Este email já foi verificado.' })
    }

    const token = gerarToken()
    await prisma.usuario.update({
      where: { id: usuario.id },
      data:  { token_verificacao: token }
    })

    await enviarEmailVerificacao(email, usuario.nome, token)
    res.json({ mensagem: 'Novo email de verificação enviado!' })
  } catch (erro) {
    console.error('Erro ao reenviar verificação:', erro)
    res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
  }
}

// ─── Solicitar reset de senha ───────────────────────────────────────────────
async function solicitarResetSenha(req, res) {
  try {
    const { email } = req.body

    const usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario || !usuario.senha) {
      return res.json({ mensagem: 'Se o email existir, você receberá as instruções.' })
    }

    const token   = gerarToken()
    const expira  = new Date(Date.now() + 60 * 60 * 1000) 

    await prisma.usuario.update({
      where: { id: usuario.id },
      data:  { token_reset_senha: token, token_reset_expira: expira }
    })

    await enviarEmailResetSenha(email, usuario.nome, token)
    res.json({ mensagem: 'Se o email existir, você receberá as instruções.' })
  } catch (erro) {
    console.error('Erro ao solicitar reset:', erro)
    res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
  }
}

// ─── Redefinir senha ────────────────────────────────────────────────────────
async function redefinirSenha(req, res) {
  try {
    const { token, novaSenha } = req.body

    if (!token || !novaSenha) {
      return res.status(400).json({ mensagem: 'Token e nova senha são obrigatórios.' })
    }
    if (novaSenha.length < 6) {
      return res.status(400).json({ mensagem: 'A senha precisa ter pelo menos 6 caracteres.' })
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        token_reset_senha: token,
        token_reset_expira: { gt: new Date() }, 
      }
    })

    if (!usuario) {
      return res.status(400).json({ mensagem: 'Token inválido ou expirado.' })
    }

    const senhaCriptografada = await bcrypt.hash(novaSenha, 10)
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha:              senhaCriptografada,
        token_reset_senha:  null,
        token_reset_expira: null,
      }
    })

    res.json({ mensagem: 'Senha redefinida com sucesso! Você já pode fazer login.' })
  } catch (erro) {
    console.error('Erro ao redefinir senha:', erro)
    res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
  }
}

// ─── Callback Google OAuth ──────────────────────────────────────────────────
async function googleCallback(req, res) {
  try {
    const { id: google_id, displayName: nome, emails } = req.user
    const email = emails[0].value

    let usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario) {
      // Cria conta nova via Google
      usuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          google_id,
          email_verificado: true, 
        }
      })
    } else if (!usuario.google_id) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data:  { google_id, email_verificado: true }
      })
    }

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '8h' })

    // Redireciona para o frontend com o token na URL
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`)
  } catch (erro) {
    console.error('Erro no callback Google:', erro)
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${FRONTEND_URL}/auth/callback?erro=Erro+ao+autenticar+com+Google`)
  }
}

module.exports = {
  login,
  cadastrar,
  verificarEmail,
  reenviarVerificacao,
  solicitarResetSenha,
  redefinirSenha,
  googleCallback,
}