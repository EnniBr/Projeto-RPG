const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listarVantagens(req, res) {
    try {
        const dados = await prisma.personagemVantagem.findMany({
            where: { personagem_id: Number(req.params.personagemId) }
        })
        res.json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function criarVantagem(req, res) {
    try {
        const dados = await prisma.personagemVantagem.create({
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

async function atualizarVantagem(req, res) {
    try {
        const dados = await prisma.personagemVantagem.update({
            where: { id: Number(req.params.id) },
            data: req.body
        })
        res.status(200).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function deletarVantagem(req, res) {
    try {
        const dados = await prisma.personagemVantagem.delete({
            where: { id: Number(req.params.id) }
        })
        res.status(200).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

module.exports = { listarVantagens, criarVantagem, atualizarVantagem, deletarVantagem }