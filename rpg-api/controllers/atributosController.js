const { PrismaClient } = require('../node_modules/@prisma/client')
const prisma = new PrismaClient()

async function listarAtributos(req, res) {
    try {
        const where = req.query.personagem_id
            ? { personagem_id: Number(req.query.personagem_id) }
            : {}
        const dados = await prisma.atributo.findMany({
            where,
            include: { personagem: true }
        })
        res.json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function criarAtributos(req, res) {
    try {
        const dados = await prisma.atributo.create({ data: req.body })
        res.status(201).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function atualizarAtributos(req, res) {
    try {
        const dados = await prisma.atributo.update({ where: { id: Number(req.params.id) }, data: req.body })
        res.status(200).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function deletarAtributos(req, res) {
    try {
        const dados = await prisma.atributo.delete({ where: { id: Number(req.params.id) } })
        res.status(200).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

module.exports = { listarAtributos, criarAtributos, atualizarAtributos, deletarAtributos }