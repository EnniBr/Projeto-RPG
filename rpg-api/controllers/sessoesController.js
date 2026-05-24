const { PrismaClient } = require('../node_modules/@prisma/client')
const prisma = new PrismaClient()

async function listarSessoes(req, res) {
    try {
        const userId = req.usuario.id

        const sessoesMestre = await prisma.sessao.findMany({
            where: { mestre_id: userId }
        })

        const sessoesJogador = await prisma.sessao.findMany({
            where: {
                personagens: {
                    some: {
                        personagem: { usuario_id: userId }
                    }
                }
            }
        })

        const todasSessoes = [
            ...sessoesMestre.map(s => ({ ...s, papel: 'mestre' })),
            ...sessoesJogador.map(s => ({ ...s, papel: 'jogador' }))
        ]

        res.json(todasSessoes)
    } catch (erro) {
        console.log('ERRO AO LISTAR SESSOES:', erro.message)
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function criarSessoes(req, res) {
    try {
        const dados = await prisma.sessao.create({
            data: {
                nome: req.body.nome,
                nivel_poder: req.body.nivel_poder,
                mestre_id: req.usuario.id
            }
        })
        res.status(201).json(dados)
    } catch (erro) {
        console.log('ERRO AO CRIAR SESSAO:', erro.message)
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function atualizarSessoes(req, res) {
    try {
        const sessao = await prisma.sessao.findUnique({ where: { id: Number(req.params.id) } })
        if (!sessao) return res.status(404).json({ mensagem: 'Sessão não encontrada' })
        if (sessao.mestre_id !== req.usuario.id) return res.status(403).json({ mensagem: 'Apenas o mestre pode editar a sessão' })

        const dados = await prisma.sessao.update({ where: { id: Number(req.params.id) }, data: req.body })
        res.status(200).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function deletarSessoes(req, res) {
    try {
        const sessao = await prisma.sessao.findUnique({ where: { id: Number(req.params.id) } })
        if (!sessao) return res.status(404).json({ mensagem: 'Sessão não encontrada' })
        if (sessao.mestre_id !== req.usuario.id) return res.status(403).json({ mensagem: 'Apenas o mestre pode deletar a sessão' })

        const dados = await prisma.sessao.delete({ where: { id: Number(req.params.id) } })
        res.status(200).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function entrarPorCodigo(req, res) {
    try {
        const codigo = req.body.codigo.toLowerCase()

        const sessao = await prisma.sessao.findUnique({
            where: { codigo },
            include: { mestre: true }
        })

        if (!sessao) {
            return res.status(404).json({ mensagem: 'Sessão não encontrada' })
        }

        const jaVinculado = await prisma.sessaoPersonagem.findFirst({
            where: {
                sessao_id: sessao.id,
                personagem: { usuario_id: req.usuario.id }
            }
        })

        res.json({ sessao, jaVinculado: !!jaVinculado })
    } catch (erro) {
        console.log('ERRO AO ENTRAR POR CODIGO:', erro.message)
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function meuPersonagemNaSessao(req, res) {
    try {
        const meusPersonagens = await prisma.personagem.findMany({
            where: { usuario_id: req.usuario.id }
        })

        if (meusPersonagens.length === 0) return res.json({ personagem: null })

        const meuIds = meusPersonagens.map(p => p.id)

        const vinculo = await prisma.sessaoPersonagem.findFirst({
            where: {
                sessao_id: Number(req.params.id),
                personagem_id: { in: meuIds }
            }
        })

        if (!vinculo) return res.json({ personagem: null })

        const pid = vinculo.personagem_id

        const [personagem, atributo, pericias, vantagens, personagemPoderes, complicacoes] = await Promise.all([
            prisma.personagem.findUnique({ where: { id: pid } }),
            prisma.atributo.findFirst({ where: { personagem_id: pid } }),
            prisma.personagemPericia.findMany({ where: { personagem_id: pid } }),
            prisma.personagemVantagem.findMany({ where: { personagem_id: pid } }),
            prisma.personagemPoder.findMany({
                where: { personagem_id: pid },
                include: { poder: true }
            }),
            prisma.personagemComplicacao.findMany({ where: { personagem_id: pid } })  // novo
        ])

        const sessaoAtual = await prisma.sessao.findUnique({ where: { id: Number(req.params.id) } })

        res.json({
            personagem: { ...personagem, atributo, pericias, vantagens, poderes: personagemPoderes.map(pp => pp.poder), complicacoes },
            configuracoes: {
                jogadores_podem_alterar_machucados: sessaoAtual?.jogadores_podem_alterar_machucados ?? false
            }
        })
    } catch (erro) {
        console.log('ERRO meuPersonagemNaSessao:', erro.message)
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function personagensDaSessao(req, res) {
    try {
        const sessaoId = Number(req.params.id)

        const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })
        if (!sessao) return res.status(404).json({ mensagem: 'Sessão não encontrada' })
        if (sessao.mestre_id !== req.usuario.id) {
            return res.status(403).json({ mensagem: 'Apenas o mestre pode ver todos os personagens' })
        }

        const vinculos = await prisma.sessaoPersonagem.findMany({
            where: { sessao_id: sessaoId }
        })

        const personagens = await Promise.all(
            vinculos.map(async v => {
                const pid = v.personagem_id
                const [personagem, atributo, pericias, vantagens, pPoderes, complicacoes] = await Promise.all([
                    prisma.personagem.findUnique({ where: { id: pid }, include: { usuario: true } }),
                    prisma.atributo.findFirst({ where: { personagem_id: pid } }),
                    prisma.personagemPericia.findMany({ where: { personagem_id: pid } }),
                    prisma.personagemVantagem.findMany({ where: { personagem_id: pid } }),
                    prisma.personagemPoder.findMany({ where: { personagem_id: pid }, include: { poder: true } }),
                    prisma.personagemComplicacao.findMany({ where: { personagem_id: pid } }),
                ])
                return {
                    ...personagem,
                    atributo,
                    pericias,
                    vantagens,
                    poderes: pPoderes.map(pp => pp.poder),
                    complicacoes,
                    emCena: v.em_cena,
                }
            })
        )

        res.json({ sessao, personagens })
    } catch (erro) {
        console.log('ERRO personagensDaSessao:', erro.message)
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function atualizarConfiguracoesSessao(req, res) {
    try {
        const id = Number(req.params.id)

        const sessao = await prisma.sessao.findUnique({ where: { id } })
        if (!sessao) return res.status(404).json({ mensagem: 'Sessão não encontrada' })
        if (Number(sessao.mestre_id) !== Number(req.usuario.id)) {
            return res.status(403).json({ mensagem: 'Apenas o mestre pode alterar configurações' })
        }

        const dados = {}
        if (typeof req.body.jogadores_podem_alterar_machucados === 'boolean') {
            dados.jogadores_podem_alterar_machucados = req.body.jogadores_podem_alterar_machucados
        }

        if (Object.keys(dados).length === 0) {
            return res.status(400).json({ mensagem: 'Nenhuma configuração enviada' })
        }

        const atualizada = await prisma.sessao.update({ where: { id }, data: dados })

        try {
            const { getIO } = require('../socket')
            getIO().to(`sessao-${id}`).emit('settings-update', {
                jogadores_podem_alterar_machucados: atualizada.jogadores_podem_alterar_machucados
            })
        } catch (socketErr) {
            console.log('Socket.io warning em configuracoes:', socketErr.message)
        }

        res.json(atualizada)
    } catch (erro) {
        console.log('ERRO atualizarConfiguracoesSessao:', erro.message)
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

async function buscarSessao(req, res) {
    try {
        const sessao = await prisma.sessao.findUnique({
            where: { id: Number(req.params.id) }
        })
        if (!sessao) return res.status(404).json({ mensagem: 'Sessão não encontrada' })
        res.json(sessao)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

module.exports = { listarSessoes, buscarSessao, criarSessoes, atualizarSessoes, deletarSessoes, entrarPorCodigo, meuPersonagemNaSessao, personagensDaSessao, atualizarConfiguracoesSessao }