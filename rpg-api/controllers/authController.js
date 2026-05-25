const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()

async function login(req, res) {
    try {
        const { email, senha } = req.body

        const usuario = await prisma.usuario.findUnique({ where: { email } })
        if (!usuario) {
            return res.status(401).json({ mensagem: 'Credenciais inválidas' })
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha)
        if (!senhaValida) {
            return res.status(401).json({ mensagem: 'Credenciais inválidas' })
        }
        
        const token = jwt.sign(
            { id: usuario.id },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        )

        res.json({ token })

    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

module.exports = { login }