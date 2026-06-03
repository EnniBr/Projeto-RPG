import { useState } from 'react'
import api from '../services/api'
import regrasV2 from '../data/regras_mm3e_v2.json'
import './ModalCriacaoNPC.css'
import PainelPoderShared from '../components/PainelPoderShared'
import regras from '../data/regras_mm3e.json'

const HABILIDADES = [
  { nome: 'Força',       chave: 'forca',       sigla: 'FOR' },
  { nome: 'Vigor',       chave: 'vigor',       sigla: 'VIG' },
  { nome: 'Agilidade',   chave: 'agilidade',   sigla: 'AGI' },
  { nome: 'Destreza',    chave: 'destreza',    sigla: 'DES' },
  { nome: 'Luta',        chave: 'luta',        sigla: 'LUT' },
  { nome: 'Intelecto',   chave: 'intelecto',   sigla: 'INT' },
  { nome: 'Consciência', chave: 'consciencia', sigla: 'CON' },
  { nome: 'Presença',    chave: 'presenca',    sigla: 'PRE' },
]

const DEFESAS_CONFIG = [
  { nome: 'Esquiva',   chave: 'esquiva',   base: 'agilidade'   },
  { nome: 'Aparar',    chave: 'aparar',    base: 'luta'        },
  { nome: 'Fortitude', chave: 'fortitude', base: 'vigor'       },
  { nome: 'Vontade',   chave: 'vontade',   base: 'consciencia' },
]

const EFEITOS_LISTA = regras.efeitos_de_poderes.efeitos
  .filter(e => e.custo_base !== null)
  .sort((a, b) => a.nome.localeCompare(b.nome))

const EXTRAS_LISTA = regras.modificadores.extras
const FALHAS_LISTA = regras.modificadores.falhas

// ─── Biblioteca ────────────────────────────────────────────────────────────
const LIBRARY_KEY = 'rpg_biblioteca_poderes'
function getBiblioteca() {
  try { return JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]') } catch { return [] }
}

function ModalCriacaoNPC({ sessaoId, onFechar, onNPCCriado, modoOffline = false, onExportarOffline }) {
  const [salvando, setSalvando] = useState(false)
  const [erro,     setErro]     = useState('')

  const [nome,        setNome]        = useState('')
  const [habilidades, setHabilidades] = useState({
    forca: 0, vigor: 0, agilidade: 0, destreza: 0,
    luta: 0, intelecto: 0, consciencia: 0, presenca: 0,
  })
  const [defesas, setDefesas] = useState({ esquiva: 0, aparar: 0, fortitude: 0, vontade: 0 })
  const [poderes, setPoderes] = useState([])

  // Biblioteca
  const [bibliotecaAberta, setBibliotecaAberta] = useState(false)
  const [biblioteca,       setBiblioteca]       = useState(getBiblioteca)

  const ppHabilidades = Object.values(habilidades).reduce((s, v) => s + v * 2, 0)
  const ppDefesas     = Object.values(defesas).reduce((s, v) => s + v, 0)
  const ppPoderes     = poderes.reduce((s, p) => s + p.custo_total, 0)
  const ppTotal       = ppHabilidades + ppDefesas + ppPoderes
  const npEquivalente = Math.max(1, Math.floor(ppTotal / 15))

  function changeHabilidade(chave, delta) {
    setHabilidades(prev => ({ ...prev, [chave]: Math.max(0, prev[chave] + delta) }))
  }
  function changeDefesa(chave, delta) {
    setDefesas(prev => ({ ...prev, [chave]: Math.max(0, prev[chave] + delta) }))
  }
  function recalcPoder(p) {
    const custo = Math.max(1, p.custo_base + p.extras.length - p.falhas.length)
    return { ...p, custo_total: custo * p.graduacoes }
  }
  function addPoder() {
    setPoderes(prev => [...prev, {
      uid: Date.now(), nome: '', efeito_base: '',
      custo_base: 1, graduacoes: 1, extras: [], falhas: [], custo_total: 1,
    }])
  }
  function removePoder(uid) { setPoderes(prev => prev.filter(p => p.uid !== uid)) }
  function updatePoder(uid, field, value) {
    setPoderes(prev => prev.map(p => p.uid !== uid ? p : recalcPoder({ ...p, [field]: value })))
  }
  function setPoderEfeito(uid, efeitoNome) {
    const efeito = EFEITOS_LISTA.find(e => e.nome === efeitoNome)
    setPoderes(prev => prev.map(p =>
      p.uid !== uid ? p : recalcPoder({ ...p, efeito_base: efeitoNome, custo_base: efeito?.custo_base ?? 1 })
    ))
  }
  function toggleMod(uid, tipo, nome) {
    setPoderes(prev => prev.map(p => {
      if (p.uid !== uid) return p
      const lista = p[tipo]
      const nova  = lista.includes(nome) ? lista.filter(x => x !== nome) : [...lista, nome]
      return recalcPoder({ ...p, [tipo]: nova })
    }))
  }

  // ─── Biblioteca ──────────────────────────────────────────────────────────

  function salvarPoderNaBiblioteca(poder) {
    const nova = [...getBiblioteca(), {
      id:          Date.now(),
      nome:        poder.nome || poder.efeito_base || 'Poder',
      efeito_base: poder.efeito_base,
      custo_base:  poder.custo_base,
      graduacoes:  poder.graduacoes,
      extras:      poder.extras  ?? [],
      falhas:      poder.falhas  ?? [],
      custo_total: poder.custo_total,
      salvoEm:     new Date().toLocaleDateString('pt-BR'),
    }]
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(nova))
    setBiblioteca(nova)
  }

  function removerDaBiblioteca(libId) {
    const nova = getBiblioteca().filter(p => p.id !== libId)
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(nova))
    setBiblioteca(nova)
  }

  function adicionarDaBiblioteca(poderLib) {
    const efeito = EFEITOS_LISTA.find(e => e.nome === poderLib.efeito_base)
    const novo = {
      uid:         Date.now(),
      nome:        poderLib.nome,
      efeito_base: poderLib.efeito_base,
      custo_base:  efeito?.custo_base ?? poderLib.custo_base ?? 1,
      graduacoes:  poderLib.graduacoes,
      extras:      poderLib.extras ?? [],
      falhas:      poderLib.falhas ?? [],
      custo_total: 1,
    }
    setPoderes(prev => [...prev, recalcPoder(novo)])
    setBibliotecaAberta(false)
  }

  // ─── Importar PDF ─────────────────────────────────────────────────────────

  async function importarDoPDF(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const buffer = await file.arrayBuffer()
      const text   = new TextDecoder('latin1').decode(new Uint8Array(buffer))
      const start  = text.lastIndexOf('%%FICHA_DATA:')
      if (start === -1) { alert('PDF sem dados de ficha do sistema.'); return }
      const dataStart = start + '%%FICHA_DATA:'.length
      const end       = text.indexOf('%%END_FICHA_DATA', dataStart)
      const dados     = JSON.parse(decodeURIComponent(escape(atob(text.slice(dataStart, end).trim()))))
      setNome(dados.personagem?.nome ?? '')
      setHabilidades({
        forca:       dados.atributos?.forca       ?? 0,
        vigor:       dados.atributos?.vigor       ?? 0,
        agilidade:   dados.atributos?.agilidade   ?? 0,
        destreza:    dados.atributos?.destreza    ?? 0,
        luta:        dados.atributos?.luta        ?? 0,
        intelecto:   dados.atributos?.intelecto   ?? 0,
        consciencia: dados.atributos?.consciencia ?? 0,
        presenca:    dados.atributos?.presenca    ?? 0,
      })
      setDefesas({
        esquiva:   dados.atributos?.esquiva   ?? 0,
        aparar:    dados.atributos?.aparar    ?? 0,
        fortitude: dados.atributos?.fortitude ?? 0,
        vontade:   dados.atributos?.vontade   ?? 0,
      })
      setPoderes(dados.poderes?.map(p => {
        const efeito = EFEITOS_LISTA.find(e => e.nome === p.efeito_base)
        const poder = {
          uid:         Date.now() + Math.random(),
          nome:        p.nome        ?? '',
          efeito_base: p.efeito_base ?? '',
          custo_base:  efeito?.custo_base ?? 1,
          graduacoes:  p.graduacoes  ?? 1,
          extras:      Array.isArray(p.extras) ? p.extras : [],
          falhas:      Array.isArray(p.falhas) ? p.falhas : [],
          custo_total: 1,
        }
        return recalcPoder(poder)
      }) ?? [])
    } catch (err) {
      alert('Erro ao ler ficha: ' + err.message)
    }
  }

  // ─── Salvar ───────────────────────────────────────────────────────────────

  async function salvar() {
    if (!nome.trim()) { setErro('O NPC precisa de um nome.'); return }

    const dadosNPC = {
      nome: nome.trim(),
      atributos: { ...habilidades, ...defesas },
      poderes: poderes.map(p => ({
        nome:        p.nome || p.efeito_base || 'Poder',
        efeito_base: p.efeito_base,
        graduacoes:  p.graduacoes,
        custo_total: p.custo_total,
        extras:      p.extras,
        falhas:      p.falhas,
        descritores: '',
      })),
    }

    if (modoOffline) {
      onExportarOffline?.(dadosNPC)
      return
    }

    setSalvando(true); setErro('')
    try {
      const resp = await api.post('/personagens/criar-completo', {
        sessao_id:    Number(sessaoId),
        nome:         dadosNPC.nome,
        tipo:         'npc',
        atributos:    dadosNPC.atributos,
        pericias:     [],
        vantagens:    [],
        poderes:      dadosNPC.poderes,
        complicacoes: [],
      })
      onNPCCriado(resp.data)
      onFechar()
    } catch (e) {
      console.error(e)
      setErro('Erro ao salvar NPC. Verifique o console.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <div className="npc-overlay" onClick={onFechar} />
      <div className="npc-modal">

        {/* Header */}
        <div className="npc-modal-header">
          <div>
            <h2 className="npc-modal-titulo">{modoOffline ? 'Criar Ficha Offline' : 'Criar NPC'}</h2>
            <p className="npc-modal-sub">
              {modoOffline
                ? 'Crie a ficha e exporte como PDF — sem salvar no banco'
                : 'Sem limite de PP — o NP equivalente é calculado automaticamente'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ padding: '6px 12px', backgroundColor: '#111', border: '1px solid #333', borderRadius: 6, color: '#aaa', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ⬆ Importar PDF
              <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={importarDoPDF} />
            </label>
            <button className="npc-fechar" onClick={onFechar}>✕</button>
          </div>
        </div>

        {/* Contador PP/NP */}
        <div className="npc-pp-barra">
          <div className="npc-pp-info">
            <span className="npc-pp-total">{ppTotal} PP gastos</span>
            <span className="npc-np-equiv">≈ NP {npEquivalente}</span>
          </div>
          <div className="npc-pp-breakdown">
            {ppHabilidades > 0 && <span>Hab: {ppHabilidades}</span>}
            {ppDefesas     > 0 && <span>Def: {ppDefesas}</span>}
            {ppPoderes     > 0 && <span>Pod: {ppPoderes}</span>}
          </div>
        </div>

        <div className="npc-corpo">

          {/* NOME */}
          <div className="npc-secao">
            <div className="npc-secao-titulo">Nome</div>
            <input type="text" className="npc-input"
              placeholder="Ex: Dr. Destruição, Guarda Robótico, Criatura das Sombras..."
              value={nome} onChange={e => setNome(e.target.value)} autoFocus />
          </div>

          {/* HABILIDADES */}
          <div className="npc-secao">
            <div className="npc-secao-titulo">Habilidades <span className="npc-custo-tag">2 PP / graduação</span></div>
            <div className="npc-hab-grid">
              {HABILIDADES.map(({ nome: n, chave, sigla }) => (
                <div key={chave} className="npc-hab-card">
                  <div className="npc-hab-sigla">{sigla}</div>
                  <div className="npc-hab-nome">{n}</div>
                  <div className="npc-controles">
                    <button className="npc-btn-ctrl" onClick={() => changeHabilidade(chave, -1)} disabled={habilidades[chave] === 0}>−</button>
                    <span className="npc-hab-valor">{habilidades[chave]}</span>
                    <button className="npc-btn-ctrl" onClick={() => changeHabilidade(chave, 1)}>+</button>
                  </div>
                  <div className="npc-hab-pp">{habilidades[chave] * 2} PP</div>
                </div>
              ))}
            </div>
          </div>

          {/* DEFESAS */}
          <div className="npc-secao">
            <div className="npc-secao-titulo">Defesas Extras <span className="npc-custo-tag">1 PP / graduação</span></div>
            <div className="npc-def-grid">
              {DEFESAS_CONFIG.map(({ nome: n, chave, base }) => {
                const baseVal = habilidades[base]
                const extra   = defesas[chave]
                return (
                  <div key={chave} className="npc-def-card">
                    <div className="npc-def-nome">{n}</div>
                    <div className="npc-def-base">base: {baseVal}</div>
                    <div className="npc-controles">
                      <button className="npc-btn-ctrl" onClick={() => changeDefesa(chave, -1)} disabled={extra === 0}>−</button>
                      <span className="npc-def-extra">+{extra}</span>
                      <button className="npc-btn-ctrl" onClick={() => changeDefesa(chave, 1)}>+</button>
                    </div>
                    <div className="npc-def-total">Total: {baseVal + extra}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* PODERES */}
          <div className="npc-secao">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div className="npc-secao-titulo" style={{ margin: 0 }}>Poderes</div>
              <button
                onClick={() => setBibliotecaAberta(a => !a)}
                style={{ marginLeft: 'auto', padding: '3px 10px', backgroundColor: bibliotecaAberta ? '#8b0000' : '#111', border: '1px solid #333', borderRadius: 6, color: bibliotecaAberta ? 'white' : '#aaa', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                📚 Biblioteca {biblioteca.length > 0 ? `(${biblioteca.length})` : ''}
              </button>
            </div>

            {/* Painel da biblioteca */}
            {bibliotecaAberta && (
              <div style={{ backgroundColor: '#0f0f0f', border: '1px solid #222', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ fontSize: '0.72rem', color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Poderes salvos — clique para adicionar
                </div>
                {biblioteca.length === 0 ? (
                  <p style={{ color: '#444', fontSize: '0.82rem' }}>
                    Nenhum poder salvo. Use o botão 💾 para salvar poderes na biblioteca.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {biblioteca.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', backgroundColor: '#1a1a1a', borderRadius: 5, border: '1px solid #222' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>{p.nome}</span>
                          {p.efeito_base && <span style={{ color: '#666', fontSize: '0.78rem' }}> — {p.efeito_base}</span>}
                          <span style={{ color: '#cc3333', fontSize: '0.78rem', marginLeft: 6 }}>{p.graduacoes}grad · {p.custo_total}PP</span>
                        </div>
                        <button onClick={() => adicionarDaBiblioteca(p)}
                          style={{ padding: '2px 8px', backgroundColor: '#8b0000', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                          + Usar
                        </button>
                        <button onClick={() => removerDaBiblioteca(p.id)}
                          style={{ padding: '2px 6px', backgroundColor: 'transparent', color: '#444', border: '1px solid #222', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {poderes.map(poder => (
              <PainelPoderShared
                key={poder.uid}
                poder={poder}
                np={np}
                ehNPC={true}
                regrasV2={regrasV2}
                extrasGenericos={regras.modificadores.extras}
                falhasGenericas={regras.modificadores.falhas}
                onRemove={() => removePoder(poder.uid)}
                onUpdate={(f, v) => updatePoder(poder.uid, f, v)}
                onSetEfeito={nome => setPoderEfeito(poder.uid, nome)}
                onToggleMod={(tipo, nome) => togglePoderMod(poder.uid, tipo, nome)}
                onSalvarNaBiblioteca={salvarPoderNaBiblioteca}
              />
            ))}
            <button className="npc-btn-add-poder" onClick={addPoder}>+ Adicionar Poder</button>
          </div>

        </div>

        {/* Rodapé */}
        <div className="npc-rodape">
          {erro && <p className="npc-erro">{erro}</p>}
          <div className="npc-rodape-acoes">
            <button className="npc-btn-cancelar" onClick={onFechar}>Cancelar</button>
            <button className="npc-btn-salvar" onClick={salvar} disabled={salvando || !nome.trim()}>
              {modoOffline ? '📄 Gerar PDF' : salvando ? 'Salvando...' : `✔ Criar NPC (NP ${npEquivalente})`}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function PainelPoderNPC({ poder, onRemove, onUpdate, onSetEfeito, onToggleMod, onSalvarNaBiblioteca }) {
  const [abaAtiva, setAbaAtiva] = useState(null)
  const efeitoInfo = EFEITOS_LISTA.find(e => e.nome === poder.efeito_base)

  return (
    <div className="npc-poder-card">
      <div className="npc-poder-header">
        <span className="npc-poder-nome">{poder.nome || '(novo poder)'}</span>
        <span className="npc-poder-custo">{poder.custo_total} PP</span>
        <button
          title="Salvar na biblioteca"
          onClick={() => onSalvarNaBiblioteca(poder)}
          style={{ background: 'none', border: '1px solid #333', borderRadius: 4, color: '#888', padding: '1px 5px', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          💾
        </button>
        <button className="npc-poder-remover" onClick={onRemove}>✕</button>
      </div>

      <div className="npc-poder-campos">
        <div className="npc-campo">
          <label>Nome</label>
          <input type="text" className="npc-input" placeholder="Nome do poder"
            value={poder.nome} onChange={e => onUpdate('nome', e.target.value)} />
        </div>
        <div className="npc-campo">
          <label>Efeito Base</label>
          <select className="npc-select" value={poder.efeito_base} onChange={e => onSetEfeito(e.target.value)}>
            <option value="">— Escolher —</option>
            {EFEITOS_LISTA.map(e => (
              <option key={e.nome} value={e.nome}>{e.nome} ({e.custo_base} PP/grad)</option>
            ))}
          </select>
        </div>
      </div>

      {efeitoInfo && <div className="npc-poder-desc">{efeitoInfo.descricao}</div>}

      <div className="npc-poder-nums">
        <div className="npc-campo">
          <label>Custo/grad</label>
          <input type="number" min="1" className="npc-input npc-input-num"
            value={poder.custo_base} onChange={e => onUpdate('custo_base', Math.max(1, Number(e.target.value)))} />
        </div>
        <div className="npc-campo">
          <label>Graduações</label>
          <input type="number" min="1" className="npc-input npc-input-num"
            value={poder.graduacoes} onChange={e => onUpdate('graduacoes', Math.max(1, Number(e.target.value)))} />
        </div>
        <div className="npc-campo">
          <label>Total</label>
          <div className="npc-poder-total">{poder.custo_total} PP</div>
        </div>
      </div>

      <div className="npc-poder-abas">
        <button className={`npc-aba ${abaAtiva === 'extras' ? 'npc-aba-ativa' : ''}`}
          onClick={() => setAbaAtiva(abaAtiva === 'extras' ? null : 'extras')}>
          ➕ Extras ({poder.extras.length})
        </button>
        <button className={`npc-aba npc-aba-falha ${abaAtiva === 'falhas' ? 'npc-aba-ativa' : ''}`}
          onClick={() => setAbaAtiva(abaAtiva === 'falhas' ? null : 'falhas')}>
          ➖ Falhas ({poder.falhas.length})
        </button>
      </div>

      {abaAtiva === 'extras' && (
        <div className="npc-mod-lista">
          {EXTRAS_LISTA.map(e => (
            <div key={e.nome} className={`npc-mod-item ${poder.extras.includes(e.nome) ? 'npc-mod-ativo' : ''}`}
              onClick={() => onToggleMod('extras', e.nome)} title={e.descricao}>
              <span>{e.nome}</span><span>+1/grad</span><span>{poder.extras.includes(e.nome) ? '✓' : '+'}</span>
            </div>
          ))}
        </div>
      )}

      {abaAtiva === 'falhas' && (
        <div className="npc-mod-lista">
          {FALHAS_LISTA.map(f => (
            <div key={f.nome} className={`npc-mod-item npc-mod-falha ${poder.falhas.includes(f.nome) ? 'npc-mod-ativo' : ''}`}
              onClick={() => onToggleMod('falhas', f.nome)} title={f.descricao}>
              <span>{f.nome}</span><span>−1/grad</span><span>{poder.falhas.includes(f.nome) ? '✓' : '+'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ModalCriacaoNPC