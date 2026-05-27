const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { getIO } = require('../socket')

async function listarPersonagens(req, res) {
    try {
        const dados = await prisma.personagem.findMany({ include: { usuario: true } })
        res.json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function criarPersonagens(req, res) {
    try {
        const dados = await prisma.personagem.create({data: req.body})
        res.status(201).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function atualizarPersonagens(req, res) {
    try {
        const dados = await prisma.personagem.update({where: { id: Number(req.params.id) }, data: req.body})
        res.status(201).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function deletarPersonagens(req, res) {
  try {
    const id = Number(req.params.id)

    const vinculo = await prisma.sessaoPersonagem.findFirst({
      where: { personagem_id: id },
      include: { sessao: true }
    })

    if (!vinculo) {
      return res.status(404).json({ mensagem: 'Personagem não encontrado' })
    }

    if (vinculo.sessao.mestre_id !== req.usuario.id) {
      return res.status(403).json({ mensagem: 'Apenas o mestre pode deletar personagens' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.sessaoPersonagem.deleteMany({ where: { personagem_id: id } })
      await tx.personagemPoder.deleteMany({ where: { personagem_id: id } })
      await tx.atributo.deleteMany({ where: { personagem_id: id } })
      await tx.personagemPericia.deleteMany({ where: { personagem_id: id } })
      await tx.personagemVantagem.deleteMany({ where: { personagem_id: id } })
      await tx.personagemComplicacao.deleteMany({ where: { personagem_id: id } })
      await tx.personagem.delete({ where: { id } })
    })

    res.status(200).json({ mensagem: 'Personagem deletado com sucesso' })
  } catch (erro) {
    console.error('Erro ao deletar personagem:', erro)
    res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
  }
}

async function criarPersonagemCompleto(req, res) {
    try {
        const { sessao_id, nome, tipo = 'jogador', atributos, pericias = [], vantagens = [], poderes = [], complicacoes = [] } = req.body

        const resultado = await prisma.$transaction(async (tx) => {

            const personagem = await tx.personagem.create({
                data: { nome, usuario_id: req.usuario.id, tipo } 
            })

            await tx.atributo.create({
                data: { ...atributos, personagem_id: personagem.id }
            })

            for (const p of pericias) {
                await tx.personagemPericia.create({
                    data: { nome_pericia: p.nome_pericia, graduacoes: p.graduacoes, personagem_id: personagem.id }
                })
            }

            for (const v of vantagens) {
                await tx.personagemVantagem.create({
                    data: { nome_vantagem: v.nome_vantagem, graduacoes: v.graduacoes, personagem_id: personagem.id }
                })
            }

            for (const poder of poderes) {
                const poderCriado = await tx.poder.create({
                    data: {
                        nome: poder.nome || poder.efeito_base,
                        efeito_base: poder.efeito_base,
                        graduacoes: poder.graduacoes,
                        custo_total: poder.custo_total,
                        extras: JSON.stringify(poder.extras || []),
                        falhas: JSON.stringify(poder.falhas || []),
                        descritores: poder.descritores || '',
                        criador_id: req.usuario.id
                    }
                })
                await tx.personagemPoder.create({
                    data: { personagem_id: personagem.id, poder_id: poderCriado.id }
                })
            }

            await tx.sessaoPersonagem.create({
                data: { sessao_id: Number(sessao_id), personagem_id: personagem.id }
            })
            
            const complicacoes = req.body.complicacoes || []

            for (const c of complicacoes) {
                await tx.personagemComplicacao.create({
                    data: {
                        titulo:    c.titulo.substring(0, 60),
                        descricao: c.descricao.substring(0, 280),
                        personagem_id: personagem.id
                    }
                })
            }

            return personagem
        })

        res.status(201).json(resultado)
    } catch (erro) {
        console.log('ERRO AO CRIAR PERSONAGEM COMPLETO:', erro.message)
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function atualizarMachucados(req, res) {
    try {
        const id         = Number(req.params.id)
        const machucados = Number(req.body.machucados)
        if (isNaN(machucados) || machucados < 0 || machucados > 4) {
            return res.status(400).json({ mensagem: 'Valor inválido (0–4)' })
        }

        const personagem = await prisma.personagem.update({
            where: { id }, data: { machucados }
        })

        // Emite para todos na sessão (mestre + jogador vê em tempo real)
        try {
            const vinculo = await prisma.sessaoPersonagem.findFirst({
                where: { personagem_id: id }
            })
            if (vinculo) {
                getIO().to(`sessao-${vinculo.sessao_id}`).emit('machucados-update', {
                    personagemId:    id,
                    machucados,
                    maxMachucados:   4,
                    owlbearTokenId:  personagem.owlbear_token_id ?? null, // pronto para Owlbear
                })
            }
        } catch (e) { console.log('Socket.io warning:', e.message) }

        res.json(personagem)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function buscarPersonagemCompleto(req, res) {
  try {
    const id = Number(req.params.id)
    const [personagem, atributo, pericias, vantagens, pPoderes, complicacoes] = await Promise.all([
      prisma.personagem.findUnique({ where: { id } }),
      prisma.atributo.findFirst({ where: { personagem_id: id } }),
      prisma.personagemPericia.findMany({ where: { personagem_id: id } }),
      prisma.personagemVantagem.findMany({ where: { personagem_id: id } }),
      prisma.personagemPoder.findMany({ where: { personagem_id: id }, include: { poder: true } }),
      prisma.personagemComplicacao.findMany({ where: { personagem_id: id } }),
    ])
    if (!personagem) return res.status(404).json({ mensagem: 'Personagem não encontrado' })
    res.json({ ...personagem, atributo, pericias, vantagens, poderes: pPoderes.map(pp => pp.poder), complicacoes })
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
  }
}

module.exports = { listarPersonagens, criarPersonagens, atualizarPersonagens, deletarPersonagens, criarPersonagemCompleto, atualizarMachucados, buscarPersonagemCompleto }