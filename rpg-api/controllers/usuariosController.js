const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcrypt = require('bcrypt')

async function criarUsuarios(req, res) {
    try {
        const { nome, email, senha, tipo } = req.body
        const senhaCriptografada = await bcrypt.hash(senha, 10)
        const dados = await prisma.usuario.create({
            data: { nome, email, senha: senhaCriptografada, tipo }
        })
        res.status(201).json(dados)
    } catch (erro) {
        console.error('Erro ao criar usuário:', erro)
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function criarUsuarios(req, res) {
    try {
        const { nome, email, senha, tipo } = req.body

        const senhaCriptografada = await bcrypt.hash(senha, 10)

        const dados = await prisma.usuario.create({
            data: {
                nome,
                email,
                senha: senhaCriptografada,
                tipo
            }
        })
        res.status(201).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function atualizarUsuarios(req, res) {
    try {
        const dados = await prisma.usuario.update({where: { id: Number(req.params.id) }, data: req.body})
        res.status(201).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function deletarUsuarios(req, res) {
    try {
        const dados = await prisma.usuario.delete({where: { id: Number(req.params.id) }})
        res.status(200).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

module.exports = { listarUsuarios, criarUsuarios, atualizarUsuarios, deletarUsuarios }