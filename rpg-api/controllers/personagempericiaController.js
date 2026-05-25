const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listarPericias(req, res) {
    try {
        const dados = await prisma.personagemPericia.findMany({
            where: { personagem_id: Number(req.params.personagemId) }
        })
        res.json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function criarPericia(req, res) {
    try {
        const dados = await prisma.personagemPericia.create({
            data: {
                ...req.body,
                personagem_id: Number(req.params.personagemId)
            }
        })
        res.status(201).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function atualizarPericia(req, res) {
    try {
        const dados = await prisma.personagemPericia.update({
            where: { id: Number(req.params.id) },
            data: req.body
        })
        res.status(200).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function deletarPericia(req, res) {
    try {
        const dados = await prisma.personagemPericia.delete({
            where: { id: Number(req.params.id) }
        })
        res.status(200).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

module.exports = { listarPericias, criarPericia, atualizarPericia, deletarPericia }