import './FichaPreviewMini.css'

// ─── Parser client-side de perícias (espelha o parsearPericias() do backend) ──
// Formato esperado: "Atletismo 4 (+6), Tecnologia 4 (+17), Percepção 4 (+8)"
// Isso é só para o preview reagir na hora — o valor "oficial" (pericias_parsed)
// é sempre recalculado pelo backend ao salvar.
export function parsePericiasPreview(texto) {
  if (!texto || !texto.trim()) return []
  return texto.split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const m = item.match(/^(.*?)(?:\s+\d+)?\s*\(([+-]?\d+)\)\s*$/)
      if (!m) return null
      const nome = m[1].trim()
      const bonus = Number(m[2])
      if (!nome || Number.isNaN(bonus)) return null
      return { nome, bonus }
    })
    .filter(Boolean)
}

function renderTextoLivre(texto) {
  if (!texto?.trim()) return null
  return texto.split('\n').filter(Boolean).map((linha, i) => {
    const partes = linha.split(/\*\*([^*]+)\*\*/)
    return (
      <p key={i} className="prev-linha" style={{ paddingLeft: linha.startsWith('  ') ? 10 : 0 }}>
        {partes.map((parte, j) => j % 2 === 1 ? <strong key={j}>{parte}</strong> : parte)}
      </p>
    )
  })
}

const HABILIDADES_PREVIEW = [
  { chave: 'forca',       sigla: 'FOR' },
  { chave: 'agilidade',   sigla: 'AGI' },
  { chave: 'luta',        sigla: 'LUT' },
  { chave: 'destreza',    sigla: 'DES' },
  { chave: 'vigor',       sigla: 'VIG' },
  { chave: 'intelecto',   sigla: 'INT' },
  { chave: 'consciencia', sigla: 'CON' },
  { chave: 'presenca',    sigla: 'PRE' },
]

/**
 * Preview compacto e ao vivo da ficha, no mesmo visual da ficha real
 * (fundo com foto, overlay escuro, tipografia Bebas Neue + Crimson Pro).
 *
 * props:
 *  - dados: objeto com os campos "flat" do Personagem (nome, forca, ..., poderes_texto, ...)
 *  - fotoUrl: string | null — URL (ou object URL local) da foto selecionada
 *  - np: nível de poder da sessão (opcional, só decorativo)
 *  - tipo: 'jogador' | 'npc'
 */
function FichaPreviewMini({ dados, fotoUrl, np, tipo = 'jogador' }) {
  const d = dados || {}
  const resistenciaTotal = (Number(d.vigor) || 0) + (Number(d.resistencia) || 0)
  const pericias = parsePericiasPreview(d.pericias_texto)

  return (
    <div className="prev-card">
      <div className="prev-bg">
        {fotoUrl
          ? <img src={fotoUrl} alt="" className="prev-bg-img" />
          : <div className="prev-bg-vazia">📷</div>}
        <div className="prev-bg-overlay" />
        <div className="prev-bg-topo">
          <span className={`prev-tipo-badge ${tipo === 'npc' ? 'prev-tipo-npc' : ''}`}>
            {tipo === 'npc' ? 'NPC' : 'JOGADOR'}
          </span>
          {np != null && <span className="prev-np-badge">NP {np}</span>}
        </div>
        <div className="prev-bg-rodape">
          <div className="prev-nome">{d.nome?.trim() || 'Nome do personagem'}</div>
        </div>
      </div>

      <div className="prev-corpo">

        <div className="prev-hab-grid">
          {HABILIDADES_PREVIEW.map(({ chave, sigla }) => (
            <div key={chave} className="prev-hab-cel">
              <span className="prev-hab-sigla">{sigla}</span>
              <span className="prev-hab-valor">{d[chave] || 0}</span>
            </div>
          ))}
        </div>

        <div className="prev-def-linha">
          <span>Esquiva <strong>+{d.esquiva || 0}</strong></span>
          <span>Aparar <strong>+{d.aparar || 0}</strong></span>
          <span>Fortitude <strong>+{d.fortitude || 0}</strong></span>
          <span>Resistência <strong>+{resistenciaTotal}</strong></span>
          <span>Vontade <strong>+{d.vontade || 0}</strong></span>
        </div>

        {d.poderes_texto?.trim() && (
          <div className="prev-secao">
            <div className="prev-secao-titulo">Poderes</div>
            {renderTextoLivre(d.poderes_texto)}
          </div>
        )}

        <div className="prev-secao">
          <div className="prev-secao-titulo">Perícias</div>
          {pericias.length > 0 ? (
            <div className="prev-pericias-lista">
              {pericias.map((p, i) => (
                <span key={i} className="prev-pericia-chip">{p.nome} <strong>+{p.bonus}</strong></span>
              ))}
            </div>
          ) : (
            <p className="prev-vazio">
              {d.pericias_texto?.trim()
                ? 'Formato não reconhecido em alguma perícia — confira os parênteses com o bônus.'
                : 'Nenhuma perícia adicionada ainda.'}
            </p>
          )}
        </div>

        {d.vantagens_texto?.trim() && (
          <div className="prev-secao">
            <div className="prev-secao-titulo">Vantagens</div>
            <p className="prev-linha">{d.vantagens_texto}</p>
          </div>
        )}

        {d.equipamentos_texto?.trim() && (
          <div className="prev-secao">
            <div className="prev-secao-titulo">Equipamentos</div>
            {renderTextoLivre(d.equipamentos_texto)}
          </div>
        )}

        {d.complicacoes_texto?.trim() && (
          <div className="prev-secao">
            <div className="prev-secao-titulo">Complicações</div>
            {renderTextoLivre(d.complicacoes_texto)}
          </div>
        )}

        {d.citacao?.trim() && (
          <div className="prev-citacao">“{d.citacao.replace(/[""]/g, '').trim()}”</div>
        )}

      </div>
    </div>
  )
}

export default FichaPreviewMini
