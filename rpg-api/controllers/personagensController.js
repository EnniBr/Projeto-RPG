const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { getIO } = require('../socket')

// ─── Helper: parseia pericias_texto em array estruturado ──────────────────────
function parsearPericias(texto) {
    if (!texto || typeof texto !== 'string') return []
    const resultados = []
    // Divide por vírgula e processa cada entrada
    const entradas = texto.split(',').map(s => s.trim()).filter(Boolean)
    for (const entrada of entradas) {
        const matchBonus = entrada.match(/\(([+-]?\d+)\)/)
        if (!matchBonus) continue
        const bonus = parseInt(matchBonus[1], 10)
        const nome = entrada
            .replace(/\(.*\)/, '')   
            .replace(/\d+/g, '')     
            .replace(/[•·]/g, '')    
            .trim()
        if (nome) resultados.push({ nome, bonus })
    }
    return resultados
}

// ─── Listar todos os personagens ──────────────────────────────────────────────
async function listarPersonagens(req, res) {
    try {
        const dados = await prisma.personagem.findMany({
            include: { usuario: true }
        })
        res.json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

// ─── Criar personagem simples (usado internamente) ────────────────────────────
async function criarPersonagens(req, res) {
    try {
        const dados = await prisma.personagem.create({ data: req.body })
        res.status(201).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

// ─── Atualizar personagem simples ─────────────────────────────────────────────
async function atualizarPersonagens(req, res) {
    try {
        const dados = await prisma.personagem.update({
            where: { id: Number(req.params.id) },
            data: req.body
        })
        res.status(200).json(dados)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

// ─── Deletar personagem ───────────────────────────────────────────────────────
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
            await tx.personagem.delete({ where: { id } })
        })

        res.status(200).json({ mensagem: 'Personagem deletado com sucesso' })
    } catch (erro) {
        console.error('Erro ao deletar personagem:', erro)
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

// ─── Criar personagem completo ────────────────────────────────────────────────
async function criarPersonagemCompleto(req, res) {
    try {
        const {
            sessao_id,
            nome,
            tipo = 'jogador',
            // identidade
            nome_civil = '',
            cidade = '',
            equipe = '',
            // atributos
            forca = 0, agilidade = 0, luta = 0, vigor = 0,
            destreza = 0, intelecto = 0, consciencia = 0, presenca = 0,
            // defesas
            esquiva = 0, aparar = 0, fortitude = 0, resistencia = 0, vontade = 0,
            // textos livres
            poderes_texto = '',
            pericias_texto = '',
            vantagens_texto = '',
            equipamentos_texto = '',
            complicacoes_texto = '',
            citacao = '',
            // aparência da ficha
            cor_primaria = '#8b0000',
            cor_secundaria = '#cccccc',
            tema_blocos = 'escuro',
            // metadados
            imagem_posicao = { x: 50, y: 20, zoom: 1.0 },
        } = req.body

        // Parseia perícias para permitir rolagens no Painel do Mestre
        const pericias_parsed = parsearPericias(pericias_texto)

        // Snapshot completo para exportação de PDF
        const ficha_snapshot = {
            nome, tipo, nome_civil, cidade, equipe,
            forca, agilidade, luta, vigor, destreza, intelecto, consciencia, presenca,
            esquiva, aparar, fortitude, resistencia, vontade,
            poderes_texto, pericias_texto, vantagens_texto,
            equipamentos_texto, complicacoes_texto, citacao,
            cor_primaria, cor_secundaria, tema_blocos,
            imagem_posicao,
        }

        const resultado = await prisma.$transaction(async (tx) => {
            const personagem = await tx.personagem.create({
                data: {
                    nome,
                    tipo,
                    nome_civil,
                    cidade,
                    equipe,
                    usuario_id: req.usuario.id,
                    forca, agilidade, luta, vigor,
                    destreza, intelecto, consciencia, presenca,
                    esquiva, aparar, fortitude, resistencia, vontade,
                    poderes_texto,
                    pericias_texto,
                    vantagens_texto,
                    equipamentos_texto,
                    complicacoes_texto,
                    citacao,
                    cor_primaria,
                    cor_secundaria,
                    tema_blocos,
                    imagem_posicao,
                    pericias_parsed,
                    ficha_snapshot,
                }
            })

            await tx.sessaoPersonagem.create({
                data: { sessao_id: Number(sessao_id), personagem_id: personagem.id }
            })

            return personagem
        })

        res.status(201).json(resultado)
    } catch (erro) {
        console.error('ERRO AO CRIAR PERSONAGEM COMPLETO:', erro.message)
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

// ─── Editar personagem completo ───────────────────────────────────────────────
async function editarPersonagemCompleto(req, res) {
    try {
        const id = Number(req.params.id)
        const {
            nome,
            nome_civil, cidade, equipe,
            forca, agilidade, luta, vigor,
            destreza, intelecto, consciencia, presenca,
            esquiva, aparar, fortitude, resistencia, vontade,
            poderes_texto, pericias_texto, vantagens_texto,
            equipamentos_texto, complicacoes_texto, citacao,
            cor_primaria, cor_secundaria, tema_blocos,
            imagem_posicao,
        } = req.body

        // Reparseia perícias sempre que a ficha é salva
        const pericias_parsed = parsearPericias(pericias_texto)

        const ficha_snapshot = {
            nome, nome_civil, cidade, equipe,
            forca, agilidade, luta, vigor,
            destreza, intelecto, consciencia, presenca,
            esquiva, aparar, fortitude, resistencia, vontade,
            poderes_texto, pericias_texto, vantagens_texto,
            equipamentos_texto, complicacoes_texto, citacao,
            cor_primaria, cor_secundaria, tema_blocos,
            imagem_posicao,
        }

        await prisma.personagem.update({
            where: { id },
            data: {
                nome,
                nome_civil,
                cidade,
                equipe,
                forca, agilidade, luta, vigor,
                destreza, intelecto, consciencia, presenca,
                esquiva, aparar, fortitude, resistencia, vontade,
                poderes_texto,
                pericias_texto,
                vantagens_texto,
                equipamentos_texto,
                complicacoes_texto,
                citacao,
                cor_primaria,
                cor_secundaria,
                tema_blocos,
                imagem_posicao,
                pericias_parsed,
                ficha_snapshot,
            }
        })

        res.json({ mensagem: 'Personagem atualizado com sucesso' })
    } catch (erro) {
        console.error('Erro ao editar personagem:', erro)
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

// ─── Buscar personagem completo ───────────────────────────────────────────────
async function buscarPersonagemCompleto(req, res) {
    try {
        const id = Number(req.params.id)
        const personagem = await prisma.personagem.findUnique({ where: { id } })
        if (!personagem) return res.status(404).json({ mensagem: 'Personagem não encontrado' })
        res.json(personagem)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

// ─── Atualizar machucados (com Socket.io) ─────────────────────────────────────
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

        try {
            const vinculo = await prisma.sessaoPersonagem.findFirst({
                where: { personagem_id: id }
            })
            if (vinculo) {
                getIO().to(`sessao-${vinculo.sessao_id}`).emit('machucados-update', {
                    personagemId:   id,
                    machucados,
                    maxMachucados:  4,
                    owlbearTokenId: personagem.owlbear_token_id ?? null,
                })
            }
        } catch (e) { console.log('Socket.io warning:', e.message) }

        res.json(personagem)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

// ─── Atualizar posição/zoom da imagem ────────────────────────────────────────
// Body: { x: 50, y: 20, zoom: 1.2 }
async function atualizarImagemPosicao(req, res) {
    try {
        const id = Number(req.params.id)
        const { x, y, zoom } = req.body

        const personagem = await prisma.personagem.update({
            where: { id },
            data: { imagem_posicao: { x, y, zoom } }
        })

        res.json(personagem)
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

// ─── Atualizar aparência (cores + tema dos blocos) ───────────────────────────
// Body: { cor_primaria: '#8b0000', cor_secundaria: '#cccccc', tema_blocos: 'escuro' }
// Regras: o mestre da sessão sempre pode; o dono do personagem só pode se a
// sessão tiver liberado jogadores_podem_personalizar_ficha.
async function atualizarAparencia(req, res) {
    try {
        const id = Number(req.params.id)
        const { cor_primaria, cor_secundaria, tema_blocos } = req.body

        const personagemAtual = await prisma.personagem.findUnique({ where: { id } })
        if (!personagemAtual) return res.status(404).json({ mensagem: 'Personagem não encontrado' })

        const vinculo = await prisma.sessaoPersonagem.findFirst({
            where: { personagem_id: id },
            include: { sessao: true }
        })

        const souDono  = personagemAtual.usuario_id === req.usuario.id
        const souMestre = vinculo?.sessao.mestre_id === req.usuario.id

        if (!souMestre) {
            if (!souDono) {
                return res.status(403).json({ mensagem: 'Sem permissão para alterar esta ficha' })
            }
            if (!vinculo?.sessao.jogadores_podem_personalizar_ficha) {
                return res.status(403).json({ mensagem: 'O mestre não liberou a personalização da ficha' })
            }
        }

        const dados = {}
        if (typeof cor_primaria === 'string')   dados.cor_primaria = cor_primaria
        if (typeof cor_secundaria === 'string') dados.cor_secundaria = cor_secundaria
        if (tema_blocos === 'claro' || tema_blocos === 'escuro') dados.tema_blocos = tema_blocos

        if (Object.keys(dados).length === 0) {
            return res.status(400).json({ mensagem: 'Nenhum campo de aparência enviado' })
        }

        const personagem = await prisma.personagem.update({ where: { id }, data: dados })
        res.json(personagem)
    } catch (erro) {
        console.error('Erro ao atualizar aparência:', erro)
        res.status(500).json({ mensagem: 'Erro interno', erro: erro.message })
    }
}

module.exports = {
    listarPersonagens,
    criarPersonagens,
    atualizarPersonagens,
    deletarPersonagens,
    criarPersonagemCompleto,
    editarPersonagemCompleto,
    buscarPersonagemCompleto,
    atualizarMachucados,
    atualizarImagemPosicao,
    atualizarAparencia,
}