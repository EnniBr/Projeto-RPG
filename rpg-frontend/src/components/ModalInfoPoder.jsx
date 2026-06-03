import './ModalInfoPoder.css'

function ModalInfoPoder({ poder, onFechar }) {
  if (!poder) return null

  return (
    <>
      <div className="info-overlay" onClick={onFechar} />
      <div className="info-modal">
        <div className="info-header">
          <div>
            <h2 className="info-titulo">{poder.nome}</h2>
            <div className="info-tags">
              <span className={`info-tag info-tag-${poder.tipo}`}>{poder.tipo}</span>
              <span className="info-tag">{poder.custo_base} PP/grad</span>
              {poder.acao      && <span className="info-tag">⚡ {poder.acao}</span>}
              {poder.alcance   && <span className="info-tag">📏 {poder.alcance}</span>}
              {poder.duracao   && <span className="info-tag">⏱ {poder.duracao}</span>}
              {poder.resistencia && <span className="info-tag">🛡 {poder.resistencia}</span>}
            </div>
          </div>
          <button className="info-fechar" onClick={onFechar}>✕</button>
        </div>

        <div className="info-corpo">
          {poder.descricao && (
            <div className="info-secao">
              <div className="info-secao-titulo">Descrição</div>
              <div className="info-texto">{poder.descricao}</div>
            </div>
          )}

          {poder.extras_especificos?.length > 0 && (
            <div className="info-secao">
              <div className="info-secao-titulo" style={{ color: '#2ecc71' }}>
                ➕ Extras Específicos ({poder.extras_especificos.length})
              </div>
              {poder.extras_especificos.map((e, i) => (
                <div key={i} className="info-mod-item info-mod-extra">
                  <div className="info-mod-nome">{e.nome}</div>
                  {e.custo && <div className="info-mod-custo">{e.custo}</div>}
                  <div className="info-mod-desc">{e.descricao}</div>
                </div>
              ))}
            </div>
          )}

          {poder.falhas_especificas?.length > 0 && (
            <div className="info-secao">
              <div className="info-secao-titulo" style={{ color: '#e74c3c' }}>
                ➖ Falhas Específicas ({poder.falhas_especificas.length})
              </div>
              {poder.falhas_especificas.map((f, i) => (
                <div key={i} className="info-mod-item info-mod-falha">
                  <div className="info-mod-nome">{f.nome}</div>
                  {f.custo && <div className="info-mod-custo">{f.custo}</div>}
                  <div className="info-mod-desc">{f.descricao}</div>
                </div>
              ))}
            </div>
          )}

          {poder.texto_integra && (
            <div className="info-secao">
              <div className="info-secao-titulo">Texto Completo do Livro</div>
              <pre className="info-texto-integra">{poder.texto_integra}</pre>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ModalInfoPoder
