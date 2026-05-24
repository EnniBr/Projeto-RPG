const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function exportarCSV(req, res) {
  try {
    const sessaoId = Number(req.params.id)
    
    const registros = await prisma.sessaoPersonagem.findMany({
      where: { sessao_id: sessaoId },
      include: {
        personagem: {
          include: { atributo: true }
        }
      }
    })

    const cabecalho = [
      'nome', 'tipo', 'pp_gastos', 'machucados',
      'forca', 'agilidade', 'luta', 'vigor',
      'destreza', 'intelecto', 'consciencia', 'presenca',
      'esquiva', 'aparar', 'fortitude', 'vontade'
    ].join(',')

    const linhas = registros.map(({ personagem: p }) => {
      const a = p.atributo
      return [
        `"${p.nome}"`,
        `"${p.tipo}"`,
        p.pontos_poder_gastos,
        p.machucados,
        a?.forca       ?? 0,
        a?.agilidade   ?? 0,
        a?.luta        ?? 0,
        a?.vigor       ?? 0,
        a?.destreza    ?? 0,
        a?.intelecto   ?? 0,
        a?.consciencia ?? 0,
        a?.presenca    ?? 0,
        a?.esquiva     ?? 0,
        a?.aparar      ?? 0,
        a?.fortitude   ?? 0,
        a?.vontade     ?? 0,
      ].join(',')
    })

    const csv = [cabecalho, ...linhas].join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="campanha-${sessaoId}.csv"`)
    res.send('\uFEFF' + csv)
  } catch (erro) {
    console.error('Erro ao exportar CSV:', erro)
    res.status(500).json({ mensagem: 'Erro ao exportar', erro: erro.message })
  }
}

module.exports = { exportarCSV }