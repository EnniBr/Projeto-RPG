const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listarPoderes(req, res) {
    try {
        const dados = await prisma.poder.findMany({ include: { criador: true } })
        res.json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function criarPoderes(req, res) {
    try {
        const dados = await prisma.poder.create({ data: req.body })
        res.status(201).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function atualizarPoderes(req, res) {
    try {
        const dados = await prisma.poder.update({ where: { id: Number(req.params.id) }, data: req.body })
        res.status(200).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function deletarPoderes(req, res) {
    try {
        const dados = await prisma.poder.delete({ where: { id: Number(req.params.id) } })
        res.status(200).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

module.exports = { listarPoderes, criarPoderes, atualizarPoderes, deletarPoderes }