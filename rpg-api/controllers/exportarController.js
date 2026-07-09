const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function exportarCSV(req, res) {
  try {
    const sessaoId = Number(req.params.id)

    const registros = await prisma.sessaoPersonagem.findMany({
      where: { sessao_id: sessaoId },
      include: { personagem: true }  // atributos agora estão no próprio personagem
    })

    const cabecalho = [
      'nome', 'tipo', 'machucados',
      'forca', 'agilidade', 'luta', 'vigor',
      'destreza', 'intelecto', 'consciencia', 'presenca',
      'esquiva', 'aparar', 'fortitude', 'resistencia', 'vontade'
    ].join(',')

    const linhas = registros.map(({ personagem: p }) => [
      `"${p.nome}"`,
      `"${p.tipo}"`,
      p.machucados,
      p.forca,
      p.agilidade,
      p.luta,
      p.vigor,
      p.destreza,
      p.intelecto,
      p.consciencia,
      p.presenca,
      p.esquiva,
      p.aparar,
      p.fortitude,
      p.resistencia,
      p.vontade,
    ].join(','))

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