// ─── Componente compartilhado PainelPoder ─────────────────────────────────
// Use este componente em CriacaoPersonagem.jsx, ModalCriacaoNPC.jsx e EditarPersonagem.jsx
// Substitui PainelPoder, PainelPoderNPC e PainelPoderEditar respectivamente
//
// IMPORTS necessários nos arquivos que usarem:
//   import PainelPoderShared from '../components/PainelPoderShared'
//   import regrasV2 from '../data/regras_mm3e_v2.json'  (ou o nome que você der)

import { useState, useMemo } from 'react'
import ModalInfoPoder from './ModalInfoPoder'

// Recebe regrasV2 como prop para não importar 2x
// OU pode importar direto aqui se preferir

export default function PainelPoderShared({
  poder,
  np,
  ehNPC = false,
  regrasV2,         // o JSON novo com efeitos enriquecidos
  extrasGenericos,  // regras.modificadores.extras (array genérico original)
  falhasGenericas,  // regras.modificadores.falhas (array genérico original)
  onRemove,
  onUpdate,
  onSetEfeito,
  onToggleMod,
  onSalvarNaBiblioteca,
}) {
  const [expandido,   setExpandido]   = useState(true)
  const [abaAtiva,    setAbaAtiva]    = useState(null)
  const [mostrarInfo, setMostrarInfo] = useState(false)

  // Encontra o efeito selecionado no JSON novo
  const efeitoSelecionado = useMemo(() =>
    regrasV2?.efeitos_de_poderes?.efeitos?.find(e => e.nome === poder.efeito_base) || null,
    [poder.efeito_base, regrasV2]
  )

  // Monta lista de extras: específicos do poder + genéricos não duplicados
  const listaExtras = useMemo(() => {
    const especificos = efeitoSelecionado?.extras_especificos || []
    const nomesEspecificos = new Set(especificos.map(e => e.nome))
    const genericos = (extrasGenericos || [])
      .filter(e => !nomesEspecificos.has(e.nome))
      .map(e => ({ nome: e.nome, descricao: e.descricao, custo: '+1 por graduação', generico: true }))
    return [
      ...especificos.map(e => ({ ...e, generico: false })),
      ...genericos,
    ]
  }, [efeitoSelecionado, extrasGenericos])

  // Monta lista de falhas: específicas + genéricas não duplicadas
  const listaFalhas = useMemo(() => {
    const especificas = efeitoSelecionado?.falhas_especificas || []
    const nomesEspecificos = new Set(especificas.map(f => f.nome))
    const genericas = (falhasGenericas || [])
      .filter(f => !nomesEspecificos.has(f.nome))
      .map(f => ({ nome: f.nome, descricao: f.descricao, custo: '-1 por graduação', generico: true }))
    return [
      ...especificas.map(f => ({ ...f, generico: false })),
      ...genericas,
    ]
  }, [efeitoSelecionado, falhasGenericas])

  // Lista de efeitos para o select
  const efeitosLista = useMemo(() =>
    (regrasV2?.efeitos_de_poderes?.efeitos || [])
      .filter(e => e.custo_base !== null)
      .sort((a, b) => a.nome.localeCompare(b.nome)),
    [regrasV2]
  )

  return (
    <>
      {/* Modal de informação do poder */}
      {mostrarInfo && efeitoSelecionado && (
        <ModalInfoPoder
          poder={efeitoSelecionado}
          onFechar={() => setMostrarInfo(false)}
        />
      )}

      <div className="poder-painel">
        {/* Header */}
        <div className="poder-header" onClick={() => setExpandido(e => !e)}>
          <div className="poder-header-info">
            <span className="poder-header-nome">{poder.nome || '(novo poder)'}</span>
            <span className="poder-header-efeito">{poder.efeito_base || 'efeito não definido'}</span>
          </div>
          <div className="poder-header-direita">
            <span className="poder-custo-badge">{poder.custo_total} PP</span>
            <span className="poder-expandir">{expandido ? '▲' : '▼'}</span>
            {onSalvarNaBiblioteca && (
              <button
                title="Salvar na biblioteca"
                onClick={e => { e.stopPropagation(); onSalvarNaBiblioteca(poder) }}
                style={{ background: 'none', border: '1px solid #333', borderRadius: 4, color: '#888', padding: '2px 6px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                💾
              </button>
            )}
            <button
              className="cria-esq-remover"
              onClick={e => { e.stopPropagation(); onRemove() }}
            >✕</button>
          </div>
        </div>

        {expandido && (
          <div className="poder-corpo">
            {/* Nome + Efeito Base */}
            <div className="poder-linha-dupla">
              <div className="cria-campo">
                <label>Nome do Poder</label>
                <input
                  type="text"
                  placeholder="Ex: Raio Solar, Campo de Força..."
                  value={poder.nome}
                  onChange={e => onUpdate('nome', e.target.value)}
                  className="cria-input"
                />
              </div>
              <div className="cria-campo">
                <label>
                  Efeito Base
                  {efeitoSelecionado && (
                    <button
                      onClick={() => setMostrarInfo(true)}
                      title="Ver descrição completa do efeito"
                      style={{
                        marginLeft: 8, background: 'none',
                        border: '1px solid #555', borderRadius: '50%',
                        color: '#aaa', width: 18, height: 18,
                        cursor: 'pointer', fontSize: '0.7rem',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      ℹ
                    </button>
                  )}
                </label>
                <select
                  value={poder.efeito_base}
                  onChange={e => onSetEfeito(e.target.value)}
                  className="cria-select"
                >
                  <option value="">— Escolher efeito —</option>
                  {efeitosLista.map(e => (
                    <option key={e.nome} value={e.nome}>
                      {e.nome} ({e.custo_base} PP/grad) — {e.tipo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descrição curta do efeito selecionado */}
            {efeitoSelecionado?.descricao && (
              <div className="poder-efeito-desc">
                <strong>{efeitoSelecionado.tipo}</strong>
                {efeitoSelecionado.acao && ` · Ação: ${efeitoSelecionado.acao}`}
                {efeitoSelecionado.alcance && ` · Alcance: ${efeitoSelecionado.alcance}`}
                {efeitoSelecionado.duracao && ` · Duração: ${efeitoSelecionado.duracao}`}
                {efeitoSelecionado.resistencia && ` · Resistência: ${efeitoSelecionado.resistencia}`}
                <br />
                <span style={{ color: '#888', fontSize: '0.85rem' }}>
                  {efeitoSelecionado.descricao.substring(0, 200)}
                  {efeitoSelecionado.descricao.length > 200 && (
                    <span
                      style={{ color: '#cc3333', cursor: 'pointer', marginLeft: 4 }}
                      onClick={() => setMostrarInfo(true)}
                    >
                      ... ler mais ℹ
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Custo / Graduações */}
            <div className="poder-linha-tripla">
              <div className="cria-campo">
                <label>Custo Base (PP/grad)</label>
                <input
                  type="number" min="1"
                  value={poder.custo_base}
                  onChange={e => onUpdate('custo_base', Math.max(1, Number(e.target.value)))}
                  className="cria-input cria-input-numero"
                />
                <span className="cria-campo-dica">Editável para efeitos variáveis</span>
              </div>
              <div className="cria-campo">
                <label>Graduações</label>
                <input
                  type="number" min="1"
                  max={ehNPC ? 99 : (np || 10)}
                  value={poder.graduacoes}
                  onChange={e => onUpdate('graduacoes', Math.max(1, Number(e.target.value)))}
                  className="cria-input cria-input-numero"
                />
              </div>
              <div className="cria-campo">
                <label>Custo Total</label>
                <div className="poder-custo-total-display">
                  {poder.custo_total} PP
                  <small>
                    ({Math.max(1, poder.custo_base + poder.extras.length - poder.falhas.length)}/grad × {poder.graduacoes})
                  </small>
                </div>
              </div>
            </div>

            {/* Abas Extras / Falhas */}
            <div className="poder-abas-ctrl">
              <button
                className={`poder-aba-btn ${abaAtiva === 'extras' ? 'poder-aba-ativa' : ''}`}
                onClick={() => setAbaAtiva(abaAtiva === 'extras' ? null : 'extras')}
              >
                ➕ Extras ({poder.extras.length})
                {listaExtras.filter(e => !e.generico).length > 0 && (
                  <span style={{ marginLeft: 6, color: '#2ecc71', fontSize: '0.7rem' }}>
                    {listaExtras.filter(e => !e.generico).length} específicos
                  </span>
                )}
              </button>
              <button
                className={`poder-aba-btn poder-aba-btn-falha ${abaAtiva === 'falhas' ? 'poder-aba-ativa' : ''}`}
                onClick={() => setAbaAtiva(abaAtiva === 'falhas' ? null : 'falhas')}
              >
                ➖ Falhas ({poder.falhas.length})
                {listaFalhas.filter(f => !f.generico).length > 0 && (
                  <span style={{ marginLeft: 6, color: '#e74c3c', fontSize: '0.7rem' }}>
                    {listaFalhas.filter(f => !f.generico).length} específicas
                  </span>
                )}
              </button>
              {(poder.extras.length > 0 || poder.falhas.length > 0) && (
                <span className="poder-mod-resumo">
                  {poder.extras.length > 0 && (
                    <span className="poder-mod-extra">+{poder.extras.length} extras</span>
                  )}
                  {poder.falhas.length > 0 && (
                    <span className="poder-mod-falha">−{poder.falhas.length} falhas</span>
                  )}
                </span>
              )}
            </div>

            {/* Lista de Extras */}
            {abaAtiva === 'extras' && (
              <div className="poder-mod-lista">
                <p className="poder-mod-explicacao">
                  Cada extra adiciona <strong>+1 PP/graduação</strong>.
                  {listaExtras.filter(e => !e.generico).length > 0 && (
                    <span style={{ color: '#2ecc71', marginLeft: 8 }}>
                      ✦ = específico deste poder
                    </span>
                  )}
                </p>
                {listaExtras.map(e => (
                  <div
                    key={e.nome}
                    className={`poder-mod-item ${poder.extras.includes(e.nome) ? 'poder-mod-ativo' : ''}`}
                    onClick={() => onToggleMod('extras', e.nome)}
                    title={e.descricao}
                  >
                    <span>
                      {!e.generico && <span style={{ color: '#2ecc71', marginRight: 4 }}>✦</span>}
                      {e.nome}
                    </span>
                    <span className="poder-mod-badge">{e.custo || '+1/grad'}</span>
                    <span>{poder.extras.includes(e.nome) ? '✓' : '+'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Lista de Falhas */}
            {abaAtiva === 'falhas' && (
              <div className="poder-mod-lista">
                <p className="poder-mod-explicacao">
                  Cada falha subtrai <strong>−1 PP/graduação</strong> (mínimo 1).
                  {listaFalhas.filter(f => !f.generico).length > 0 && (
                    <span style={{ color: '#e74c3c', marginLeft: 8 }}>
                      ✦ = específica deste poder
                    </span>
                  )}
                </p>
                {listaFalhas.map(f => (
                  <div
                    key={f.nome}
                    className={`poder-mod-item poder-mod-item-falha ${poder.falhas.includes(f.nome) ? 'poder-mod-ativo' : ''}`}
                    onClick={() => onToggleMod('falhas', f.nome)}
                    title={f.descricao}
                  >
                    <span>
                      {!f.generico && <span style={{ color: '#e74c3c', marginRight: 4 }}>✦</span>}
                      {f.nome}
                    </span>
                    <span className="poder-mod-badge poder-mod-badge-falha">{f.custo || '-1/grad'}</span>
                    <span>{poder.falhas.includes(f.nome) ? '✓' : '+'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
