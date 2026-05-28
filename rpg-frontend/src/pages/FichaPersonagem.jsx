import { useState, useEffect, useRef } from 'react'
import { useSessao } from '../contexts/SessaoContext'
import { useSocket } from '../contexts/SocketContext'
import api from '../services/api'
import dadoIcon from '../assets/dice-d20-svgrepo-com.svg'
import regras from '../data/regras_mm3e.json'
import './FichaPersonagem.css'
import { jwtDecode } from 'jwt-decode'
import ModalExportarFicha from '../components/ModalExportarFicha'
import ModalImportarFicha from '../components/ModalImportarFicha'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

// ─── Constantes ────────────────────────────────────────────────────────────

const STATUS_INFO = [
  { classe: 'status-ok',      texto: '✔ Sem penalidades' },
  { classe: 'status-leve',    texto: '⚠ −1 Resistência' },
  { classe: 'status-medio',   texto: '⚠ −2 Resistência · Atordoado' },
  { classe: 'status-grave',   texto: '✖ −3 Resistência · Incapacitado' },
  { classe: 'status-critico', texto: '☠ −4 Resistência · Ferimento Grave!' },
]
const CORES_MACH = ['#2ecc71', '#f1c40f', '#e67e22', '#c0392b', '#8b0000']
const MAX_MACH   = 4

const ATRIBUTOS = [
  { sigla: 'FOR', chave: 'forca'       },
  { sigla: 'AGI', chave: 'agilidade'   },
  { sigla: 'LUT', chave: 'luta'        },
  { sigla: 'CON', chave: 'consciencia' },
  { sigla: 'VIG', chave: 'vigor'       },
  { sigla: 'DES', chave: 'destreza'    },
  { sigla: 'INT', chave: 'intelecto'   },
  { sigla: 'PRE', chave: 'presenca'    },
]

const HAB_PARA_CHAVE = {
  'Força': 'forca', 'Vigor': 'vigor', 'Agilidade': 'agilidade',
  'Destreza': 'destreza', 'Luta': 'luta', 'Intelecto': 'intelecto',
  'Consciência': 'consciencia', 'Prontidão': 'consciencia', 'Presença': 'presenca',
}
const PERICIA_INFO = {}
regras.pericias.forEach(p => {
  PERICIA_INFO[p.nome] = {
    habilidade: p.habilidade_vinculada,
    chave:      HAB_PARA_CHAVE[p.habilidade_vinculada] ?? null,
    sigla:      p.habilidade_vinculada?.substring(0, 3).toUpperCase() ?? '—',
    uso:        p.descricao ?? '',
  }
})

// ─── Parser de dados ────────────────────────────────────────────────────────

function parseDados(notacao) {
  const s = notacao.trim().toLowerCase().replace(/\s+/g, '')
  if (!s) return null

  let total = 0
  const partes = []
  const tokens = s.split(/(?=[+-])/)

  for (const token of tokens) {
    const sinal = token.startsWith('-') ? -1 : 1
    const parte  = token.replace(/^[+-]/, '')
    if (!parte) continue

    if (parte.includes('d')) {
      const idx   = parte.indexOf('d')
      const qtd   = parseInt(parte.substring(0, idx)) || 1
      const lados = parseInt(parte.substring(idx + 1))
      if (isNaN(lados) || lados < 1) continue
      const resultados = Array.from({ length: qtd }, () => Math.floor(Math.random() * lados) + 1)
      const soma = resultados.reduce((a, b) => a + b, 0)
      total += sinal * soma
      partes.push({ tipo: 'dado', qtd, lados, resultados, soma: sinal * soma })
    } else {
      const num = parseInt(parte)
      if (!isNaN(num)) { total += sinal * num; partes.push({ tipo: 'modificador', valor: sinal * num }) }
    }
  }

  if (partes.length === 0) return null
  const d20s   = partes.filter(p => p.tipo === 'dado' && p.lados === 20).flatMap(p => p.resultados)
  const critico = d20s.includes(20)
  const fumble  = d20s.includes(1) && !critico
  return { total, partes, critico, fumble }
}

function formatarPartes(partes) {
  return partes.map(p => {
    if (p.tipo === 'dado') {
      const sinal = p.soma < 0 ? '−' : ''
      return `${sinal}${p.qtd}d${p.lados}(${p.resultados.join(', ')})`
    }
    return p.valor >= 0 ? `+${p.valor}` : `${p.valor}`
  }).join(' ')
}

// ─── Componente Principal ──────────────────────────────────────────────────

function FichaPersonagem() {
  const { id }     = useParams()
  const [searchParams]   = useSearchParams()
  const personagemIdParam = searchParams.get('personagemId')
  const navigate   = useNavigate()
  const { sessaoAtiva, setSessaoAtiva } = useSessao()
  const historicRef = useRef(null)
  const inputRef    = useRef(null)
  const socket     = useSocket()

  const [abaMobile,      setAbaMobile]      = useState('combate') // ← novo
  const [uploadandoFoto, setUploadandoFoto] = useState(false)
  const [personagem,     setPersonagem]     = useState(null)
  const [atributos,      setAtributos]      = useState(null)
  const [pericias,       setPericias]       = useState([])
  const [vantagens,      setVantagens]      = useState([])
  const [poderes,        setPoderes]        = useState([])
  const [complicacoes,   setComplicacoes]   = useState([])
  const [sessao,         setSessao]         = useState(sessaoAtiva)
  const [carregando,     setCarregando]     = useState(true)
  const [semPersonagem,  setSemPersonagem]  = useState(false)
  const [machucados,     setMachucados]     = useState(0)
  const [fotoAberta,     setFotoAberta]     = useState(false)
  const [rolls,          setRolls]          = useState([])
  const [diceInput,      setDiceInput]      = useState('')
  const [jogsPodemAlterar, setJogsPodemAlterar] = useState(false)
  const [modalExportar, setModalExportar] = useState(false)
  const [modalImportar, setModalImportar] = useState(false)

  const token     = localStorage.getItem('token')
  const meuUserId = token ? jwtDecode(token).id : null
  const ehMeuChar = !personagemIdParam && personagem?.usuario_id === meuUserId

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') setFotoAberta(false) }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [])

  useEffect(() => {
    if (historicRef.current) historicRef.current.scrollTop = historicRef.current.scrollHeight
  }, [rolls])

  useEffect(() => {
  async function carregar() {
    try {
      let sessaoLocal = sessaoAtiva
      if (!sessaoLocal) {
        const resp = await api.get(`/sessoes/${id}`)
        sessaoLocal = resp.data
      }
      setSessao(sessaoLocal)
      setSessaoAtiva(sessaoLocal)

      if (personagemIdParam) {
        const resp  = await api.get(`/personagens/${personagemIdParam}/completo`)
        const dados = resp.data
        setPersonagem(dados)
        setAtributos(dados.atributo        ?? null)
        setPericias(dados.pericias         ?? [])
        setVantagens(dados.vantagens       ?? [])
        setPoderes(dados.poderes           ?? [])
        setComplicacoes(dados.complicacoes ?? [])
        setMachucados(dados.machucados     ?? 0)
        setJogsPodemAlterar(true) 
        return
      }

      const resp  = await api.get(`/sessoes/${id}/meu-personagem`)
      const dados = resp.data.personagem
      if (!dados) { setSemPersonagem(true); return }

      setPersonagem(dados)
      setAtributos(dados.atributo        ?? null)
      setPericias(dados.pericias         ?? [])
      setVantagens(dados.vantagens       ?? [])
      setPoderes(dados.poderes           ?? [])
      setComplicacoes(dados.complicacoes ?? [])
      setMachucados(dados.machucados     ?? 0)
      if (resp.data.configuracoes) {
        setJogsPodemAlterar(resp.data.configuracoes.jogadores_podem_alterar_machucados ?? false)
      }
    } catch (e) {
      console.error('Erro ao carregar ficha:', e)
    } finally {
      setCarregando(false)
    }
  }
  carregar()
}, [id, personagemIdParam])

  useEffect(() => {
    if (!socket || !personagem) return
    socket.emit('join-session', Number(id))
    socket.on('machucados-update', ({ personagemId, machucados }) => {
      if (personagemId === personagem.id) setMachucados(machucados)
    })
    socket.on('settings-update', ({ jogadores_podem_alterar_machucados }) => {
      setJogsPodemAlterar(jogadores_podem_alterar_machucados)
    })
    return () => {
      socket.off('machucados-update')
      socket.off('settings-update')
    }
  }, [socket, id, personagem])

  // ─── Rolagem ────────────────────────────────────────────────────────────

  function adicionarRoll(label, notacao, resultado) {
    if (!resultado) return
    const novoRoll = {
      id: Date.now(), label, notacao, ...resultado,
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }
    setRolls(prev => [...prev.slice(-49), novoRoll])
    if (socket && personagem) {
      socket.emit('dice-roll', {
        sessao_id:      Number(id),
        label,
        total:          resultado.total,
        critico:        resultado.critico,
        fumble:         resultado.fumble,
        detalhes:       formatarPartes(resultado.partes),
        personagemNome: personagem.nome,
        horario:        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      })
    }
  }

  function rolarNotacao(label, notacao) {
    adicionarRoll(label, notacao, parseDados(notacao))
  }

  function rolarPericiaLivre(nomePer) {
    const info    = PERICIA_INFO[nomePer]
    const baseAtr = info?.chave ? (atributos?.[info.chave] ?? 0) : 0
    const grad    = pericias.find(p => p.nome_pericia === nomePer)?.graduacoes ?? 0
    const mod     = baseAtr + grad
    rolarNotacao(nomePer, mod !== 0 ? `1d20+${mod}` : '1d20')
  }

  function handleDiceInput(e) { if (e.key === 'Enter') submitDice() }
  function submitDice() {
    if (!diceInput.trim()) return
    rolarNotacao(diceInput.trim(), diceInput.trim())
    setDiceInput('')
    inputRef.current?.focus()
  }

  async function handleFotoUpload(e) {
    const file = e.target.files[0]
    if (!file || !personagem) return
    setUploadandoFoto(true)
    try {
      const form = new FormData()
      form.append('foto', file)
      const resp = await api.post(`/personagens/${personagem.id}/foto`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setPersonagem(prev => ({ ...prev, foto: resp.data.url }))
    } catch (e) {
      console.error('Erro ao fazer upload:', e)
    } finally {
      setUploadandoFoto(false)
    }
  }

  // ─── Defesas ────────────────────────────────────────────────────────────

  function defTotal(chaveComp, chaveBase) {
    return (atributos?.[chaveBase] ?? 0) + (atributos?.[chaveComp] ?? 0)
  }

  const poderProtecao    = poderes.find(p =>
    p.efeito_base?.toLowerCase().includes('proteção') ||
    p.efeito_base?.toLowerCase().includes('protecao') ||
    p.nome?.toLowerCase().includes('proteção')
  )
  const rankProtecao     = poderProtecao?.graduacoes ?? 0
  const resistenciaTotal = (atributos?.vigor ?? 0) + rankProtecao
  const pct              = ((MAX_MACH - machucados) / MAX_MACH) * 100
  const statusAtual      = STATUS_INFO[machucados]

  async function alterarMachucados(delta) {
    if (!jogsPodemAlterar) return
    const novo = Math.min(MAX_MACH, Math.max(0, machucados + delta))
    setMachucados(novo)
    try {
      await api.patch(`/personagens/${personagem.id}/machucados`, { machucados: novo })
    } catch (e) {
      console.error('Erro ao salvar machucados:', e)
    }
  }

  function notacaoMod(mod) {
    return mod !== 0 ? `1d20+${mod}` : '1d20'
  }

  // ─── Loading / sem personagem ────────────────────────────────────────────

  if (carregando) {
    return <div style={{ color: 'white', padding: 40, textAlign: 'center', backgroundColor: 'black', minHeight: '100vh' }}>Carregando ficha...</div>
  }

  if (semPersonagem) {
    return (
      <div style={{ color: 'white', backgroundColor: 'black', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, fontFamily: 'Crimson Pro, serif' }}>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>Você ainda não tem um personagem nesta sessão.</p>
        <button onClick={() => navigate(`/sessao/${id}/criar-personagem`)}
          style={{ padding: '12px 28px', backgroundColor: '#8b0000', color: 'white', border: 'none', borderRadius: 6, fontSize: '1rem', cursor: 'pointer' }}>
          Criar Personagem
        </button>
      </div>
    )
  }

  const nome = personagem?.nome ?? 'Personagem'
  const np   = sessao?.nivel_poder ?? '?'

  const poderesOfensivos = poderes.filter(p =>
    p.efeito_base?.toLowerCase().includes('dano') ||
    p.efeito_base?.toLowerCase().includes('aflição') ||
    p.efeito_base?.toLowerCase().includes('afeto')
  )

  // Props compartilhadas para evitar repetição
  const propsOfensivo  = { atributos, poderesOfensivos, dadoIcon, rolarNotacao, notacaoMod }
  const propsDefensivo = { atributos, defTotal, resistenciaTotal, dadoIcon, rolarNotacao, notacaoMod }
  const propsMach      = { machucados, pct, statusAtual, jogsPodemAlterar, alterarMachucados }
  const propsPericias  = { pericias, atributos, dadoIcon, rolarPericiaLivre }
  const propsFoto      = { personagem, ehMeuChar, uploadandoFoto, fotoAberta, setFotoAberta, handleFotoUpload }
  const propsDados     = { atributos, defTotal, resistenciaTotal, poderesOfensivos, rolls, diceInput, setDiceInput, handleDiceInput, submitDice, rolarNotacao, notacaoMod, historicRef, inputRef, dadoIcon }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh' }}>

      {/* TOPO */}
      <div className="topo">
        <div className="topo-esquerda"><h1>{nome.toUpperCase()}</h1></div>
        <div className="topo-centro">
          <p><strong>Sessão:</strong> {sessao?.nome ?? '—'}</p>
          <p><strong>NP:</strong> {np}</p>
        </div>
        <div className="topo-direita">
          <h1>NP {np}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ padding: '4px 12px', backgroundColor: '#111', border: '1px solid #333', borderRadius: 4, color: '#aaa', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              ← Dashboard
            </button>
            <button
              onClick={() => setModalExportar(true)}
              style={{ padding: '4px 12px', backgroundColor: '#111', border: '1px solid #333', borderRadius: 4, color: '#aaa', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              ⬇ Exportar PDF
            </button>
            <button
              onClick={() => setModalImportar(true)}
              style={{ padding: '4px 12px', backgroundColor: '#111', border: '1px solid #333', borderRadius: 4, color: '#aaa', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              ⬆ Importar
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          DESKTOP — 3 colunas
          ══════════════════════════════ */}
      <div className="container">

        {/* COLUNA 1 */}
        <div className="coluna" id="coluna1">
          <div className="grid-atributos">
            {ATRIBUTOS.map(({ sigla, chave }) => (
              <div key={chave} className="caixa-atributo">
                <div className="atr-titulo">{sigla}</div>
                <div className="atr-valor">{atributos?.[chave] ?? 0}</div>
              </div>
            ))}
          </div>
          <div className="ficha-secoes">
            <SecaoPoderes poderes={poderes} />
            <SecaoVantagens vantagens={vantagens} />
            <SecaoOfensivo {...propsOfensivo} />
            <SecaoDefensivo {...propsDefensivo} />
            <SecaoComplicacoes complicacoes={complicacoes} />
          </div>
        </div>

        {/* COLUNA 2 — PERÍCIAS */}
        <div className="coluna" id="coluna2">
          <SecaoPericias {...propsPericias} />
          <SecaoMachucados {...propsMach} />
        </div>

        {/* COLUNA 3 — FOTO + DADOS */}
        <div className="coluna" id="coluna3">
          <BlocoFoto {...propsFoto} />
          <div className="dados-wrapper">
            <BlocoDados {...propsDados} />
          </div>
        </div>

      </div>

      {/* ══════════════════════════════
          MOBILE — abas
          ══════════════════════════════ */}
      <div className="mobile-content">

        {/* ABA: COMBATE */}
        {abaMobile === 'combate' && (
          <div className="mobile-aba-content">
            <div className="mobile-mach-destaque">
              <div className="mobile-mach-titulo">Estado de Combate</div>
              <SecaoMachucados {...propsMach} />
            </div>
            <div className="grid-atributos" style={{ marginBottom: 8 }}>
              {ATRIBUTOS.map(({ sigla, chave }) => (
                <div key={chave} className="caixa-atributo">
                  <div className="atr-titulo">{sigla}</div>
                  <div className="atr-valor">{atributos?.[chave] ?? 0}</div>
                </div>
              ))}
            </div>
            <SecaoOfensivo {...propsOfensivo} />
            <SecaoDefensivo {...propsDefensivo} />
          </div>
        )}

        {/* ABA: DADOS */}
        {abaMobile === 'dados' && (
          <div className="mobile-aba-content mobile-dados-wrapper">
            <div className="dados-rapidos-titulo">Rolagens Rápidas</div>
            <div className="dados-rapidos">
              <button className="dados-btn-rapido"
                onClick={() => rolarNotacao('Iniciativa', notacaoMod(atributos?.consciencia ?? 0))}>
                ⚡ Iniciativa (+{atributos?.consciencia ?? 0})
              </button>
              <button className="dados-btn-rapido"
                onClick={() => rolarNotacao('Resistência', notacaoMod(resistenciaTotal))}>
                🛡 Resistência (+{resistenciaTotal})
              </button>
              <button className="dados-btn-rapido"
                onClick={() => rolarNotacao('Vontade', notacaoMod(defTotal('vontade', 'consciencia')))}>
                🧠 Vontade (+{defTotal('vontade', 'consciencia')})
              </button>
              <button className="dados-btn-rapido"
                onClick={() => rolarNotacao('Fortitude', notacaoMod(defTotal('fortitude', 'vigor')))}>
                💪 Fortitude (+{defTotal('fortitude', 'vigor')})
              </button>
              {poderesOfensivos.map(p => (
                <button key={p.id} className="dados-btn-rapido dados-btn-ataque"
                  onClick={() => rolarNotacao(`Ataque: ${p.nome}`, notacaoMod(atributos?.luta ?? 0))}>
                  ⚔ {p.nome} (CD {15 + p.graduacoes})
                </button>
              ))}
            </div>
            <div className="dados-historico" ref={historicRef} style={{ minHeight: '40vh' }}>
              {rolls.length === 0 && (
                <div className="dados-historico-vazio">Os resultados das rolagens aparecem aqui</div>
              )}
              {rolls.map(r => <RollResult key={r.id} roll={r} />)}
            </div>
            <div className="mobile-dados-input-sticky">
              <div className="dados-input-bar">
                <input ref={inputRef} className="dados-input"
                  placeholder="Ex: 1d20, 2d6+3, 1d20+5"
                  value={diceInput}
                  onChange={e => setDiceInput(e.target.value)}
                  onKeyDown={handleDiceInput} />
                <button className="dados-input-btn" onClick={submitDice}>
                  <img src={dadoIcon} alt="rolar" style={{ width: 20, height: 20, filter: 'invert(1)' }} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: PERÍCIAS */}
        {abaMobile === 'pericias' && (
          <div className="mobile-aba-content">
            <SecaoPericias {...propsPericias} />
          </div>
        )}

        {/* ABA: FICHA */}
        {abaMobile === 'ficha' && (
          <div className="mobile-aba-content">
            <div className="mobile-foto-row">
              <BlocoFoto {...propsFoto} />
              <div className="mobile-foto-info">
                <div className="mobile-foto-nome">{nome}</div>
                <div className="mobile-foto-sessao">{sessao?.nome ?? '—'}</div>
                <div className="mobile-foto-np">NP {np}</div>
              </div>
            </div>
            <SecaoPoderes poderes={poderes} />
            <SecaoVantagens vantagens={vantagens} />
            <SecaoComplicacoes complicacoes={complicacoes} />
          </div>
        )}

      </div>

      {/* MODAL FOTO */}
      {fotoAberta && personagem?.foto && (
        <div className="foto-modal aberto" onClick={() => setFotoAberta(false)}>
          <button className="foto-modal-fechar" onClick={() => setFotoAberta(false)}>✕</button>
          <img src={personagem.foto} className="foto-modal-img" alt="Foto ampliada"
            onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* BOTTOM TAB BAR — visível só no mobile via CSS */}
      <nav className="mobile-tab-bar">
        {[
          { id: 'combate',  icone: '⚔',  label: 'Combate'  },
          { id: 'dados',    icone: '🎲',  label: 'Dados'    },
          { id: 'pericias', icone: '📋',  label: 'Perícias' },
          { id: 'ficha',    icone: '🦸',  label: 'Ficha'    },
        ].map(tab => (
          <button
            key={tab.id}
            className={`mobile-tab ${abaMobile === tab.id ? 'ativa' : ''}`}
            onClick={() => setAbaMobile(tab.id)}
          >
            <span className="mobile-tab-icone">{tab.icone}</span>
            <span className="mobile-tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

    {modalExportar && personagem && (
        <ModalExportarFicha
          personagem={personagem}
          atributos={atributos}
          pericias={pericias}
          vantagens={vantagens}
          poderes={poderes}
          complicacoes={complicacoes}
          sessao={sessao}
          onFechar={() => setModalExportar(false)}
        />
      )}

      {modalImportar && (
        <ModalImportarFicha
          sessaoId={id}
          personagensExistentes={personagem ? [personagem] : []}
          ehMestre={false}
          onFechar={() => setModalImportar(false)}
          onImportado={() => window.location.reload()}
        />
      )}

    </div>
  )
}

// ─── Componentes auxiliares ────────────────────────────────────────────────

function SecaoPoderes({ poderes }) {
  return (
    <div className="secao">
      <div className="secao-titulo">PODERES</div>
      <div className="secao-conteudo">
        {poderes.length === 0
          ? <p style={{ color: '#666' }}>Nenhum poder cadastrado.</p>
          : poderes.map(p => (
            <p key={p.id}>
              <strong>{p.nome}</strong>
              {p.efeito_base && ` — ${p.efeito_base}`}
              {` ${p.graduacoes}grad`}
              <span style={{ color: '#cc3333', marginLeft: 6 }}>({p.custo_total} PP)</span>
            </p>
          ))
        }
      </div>
    </div>
  )
}

function SecaoVantagens({ vantagens }) {
  return (
    <div className="secao">
      <div className="secao-titulo">VANTAGENS</div>
      <div className="secao-conteudo">
        {vantagens.length === 0
          ? <p style={{ color: '#666' }}>Nenhuma vantagem cadastrada.</p>
          : vantagens.map(v => (
            <p key={v.id}><strong>{v.nome_vantagem}</strong>{v.graduacoes > 1 && ` ${v.graduacoes}`}</p>
          ))
        }
      </div>
    </div>
  )
}

function SecaoComplicacoes({ complicacoes }) {
  return (
    <div className="secao">
      <div className="secao-titulo">COMPLICAÇÕES</div>
      <div className="secao-conteudo">
        {complicacoes.length === 0
          ? <p style={{ color: '#666' }}>Nenhuma complicação cadastrada.</p>
          : complicacoes.map(c => (
            <div key={c.id} style={{ marginBottom: 8 }}>
              <strong style={{ color: '#cc3333' }}>{c.titulo}</strong>
              {c.descricao && <p style={{ color: '#999', margin: '2px 0 0', fontSize: '0.82rem', lineHeight: 1.5 }}>{c.descricao}</p>}
            </div>
          ))
        }
      </div>
    </div>
  )
}

function SecaoOfensivo({ atributos, poderesOfensivos, dadoIcon, rolarNotacao, notacaoMod }) {
  return (
    <div className="secao">
      <div className="secao-titulo">OFENSIVO</div>
      <div className="secao-conteudo ofensivo-conteudo">
        <div className="ofensivo-iniciativa"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          title="Clique para rolar Iniciativa"
          onClick={() => rolarNotacao('Iniciativa', notacaoMod(atributos?.consciencia ?? 0))}>
          <img src={dadoIcon} alt="d20" style={{ width: 14, height: 14, filter: 'invert(1)', opacity: 0.7 }} />
          INICIATIVA +{atributos?.consciencia ?? 0}
        </div>
        {poderesOfensivos.length === 0
          ? <p style={{ color: '#666', fontSize: '0.8rem', marginTop: 6 }}>Nenhum poder ofensivo cadastrado.</p>
          : poderesOfensivos.map(p => {
              const modAtaque = atributos?.luta ?? 0
              const cdDano    = 15 + p.graduacoes
              return (
                <div key={p.id} className="ofensivo-poder-bloco">
                  <div className="ofensivo-poder-nome">{p.nome}</div>
                  <div className="ofensivo-poder-linha" style={{ cursor: 'pointer' }}
                    title="Clique para rolar o ataque"
                    onClick={() => rolarNotacao(`Ataque: ${p.nome}`, notacaoMod(modAtaque))}>
                    <img src={dadoIcon} alt="d20" style={{ width: 13, filter: 'invert(1)', opacity: 0.7 }} />
                    <span>Ataque: 1d20 + {modAtaque} (LUT)</span>
                  </div>
                  <div className="ofensivo-poder-cd">
                    Se acertar → alvo rola Resistência vs CD {cdDano}
                  </div>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}

function SecaoDefensivo({ atributos, defTotal, resistenciaTotal, dadoIcon, rolarNotacao, notacaoMod }) {
  return (
    <div className="secao">
      <div className="secao-titulo">DEFENSIVO</div>
      <div className="secao-conteudo">
        <div className="def-grupo-label">Defesas passivas — o atacante precisa superar</div>
        {[
          { label: 'ESQUIVA', valor: defTotal('esquiva', 'agilidade') },
          { label: 'APARAR',  valor: defTotal('aparar',  'luta')      },
        ].map(({ label, valor }) => (
          <div key={label} className="defensivo-item">
            <span className="def-nome">{label}</span>
            <span className="def-valor def-passiva">{valor}</span>
          </div>
        ))}
        <div style={{ height: 1, backgroundColor: '#1e1e1e', margin: '8px 0' }} />
        <div className="def-grupo-label">Testes defensivos — clique para rolar</div>
        {[
          { label: 'FORTITUDE',   valor: defTotal('fortitude', 'vigor'),    fn: () => rolarNotacao('Fortitude',   notacaoMod(defTotal('fortitude', 'vigor'))) },
          { label: 'RESISTÊNCIA', valor: resistenciaTotal,                   fn: () => rolarNotacao('Resistência', notacaoMod(resistenciaTotal)) },
          { label: 'VONTADE',     valor: defTotal('vontade', 'consciencia'), fn: () => rolarNotacao('Vontade',     notacaoMod(defTotal('vontade', 'consciencia'))) },
        ].map(({ label, valor, fn }) => (
          <div key={label} className="defensivo-item" style={{ cursor: 'pointer' }}
            onClick={fn} title={`Clique para rolar ${label}`}>
            <span className="def-nome">{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="def-valor">+{valor}</span>
              <img src={dadoIcon} alt="d20" style={{ width: 13, filter: 'invert(1)', opacity: 0.45 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SecaoPericias({ pericias, atributos, dadoIcon, rolarPericiaLivre }) {
  return (
    <div className="secao pericias-secao">
      <div className="secao-titulo" style={{ textAlign: 'center' }}>PERÍCIAS</div>
      <div className="pericias-header">
        <span className="ph-pericia">PERÍCIA</span>
        <span>ATR.</span>
        <span>RANKS</span>
        <span>TOTAL</span>
      </div>
      <div className="pericias-lista">
        {regras.pericias.map(p => {
          const treinada = pericias.find(x => x.nome_pericia === p.nome)
          const info     = PERICIA_INFO[p.nome]
          const baseAtr  = info?.chave ? (atributos?.[info.chave] ?? 0) : 0
          const grad     = treinada?.graduacoes ?? 0
          const total    = baseAtr + grad
          return (
            <div key={p.nome} className="pericia-linha" style={{ opacity: treinada ? 1 : 0.4 }}>
              <img src={dadoIcon} className="per-dado-icon" alt="rolar"
                title={`Rolar ${p.nome}: 1d20 + ${total}`}
                style={{ cursor: 'pointer', opacity: 1 }}
                onClick={() => rolarPericiaLivre(p.nome)} />
              <span className="per-nome" title={p.descricao}>{p.nome}</span>
              <span className="per-atr">{info?.sigla ?? '—'}</span>
              <span className="per-bonus">{treinada ? `+${grad}` : '—'}</span>
              <span className="per-temp" style={{ color: treinada ? 'white' : '#666' }}>+{total}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SecaoMachucados({ machucados, pct, statusAtual, jogsPodemAlterar, alterarMachucados }) {
  return (
    <div className="secao machucados-secao" style={{ marginTop: 0 }}>
      <div className="secao-titulo" style={{ textAlign: 'center' }}>MACHUCADOS</div>
      <div className="machucados-conteudo">
        <div className="machucados-barra-wrapper">
          <div className="machucados-barra-bg">
            <div className="machucados-barra-fill"
              style={{ width: `${pct}%`, backgroundColor: CORES_MACH[machucados] }} />
            <span className="machucados-barra-texto">{machucados} / {MAX_MACH}</span>
          </div>
        </div>
        {jogsPodemAlterar ? (
          <div className="machucados-controles">
            <button className="btn-mach" onClick={() => alterarMachucados(-4)}>«</button>
            <button className="btn-mach" onClick={() => alterarMachucados(-1)}>‹</button>
            <button className="btn-mach" onClick={() => alterarMachucados(+1)}>›</button>
            <button className="btn-mach" onClick={() => alterarMachucados(+4)}>»</button>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#555', fontSize: '0.78rem', fontFamily: 'Crimson Pro, serif', margin: '4px 0', fontStyle: 'italic' }}>
            O mestre controla os machucados
          </p>
        )}
        <div className="machucados-status">
          <span className={statusAtual.classe}>{statusAtual.texto}</span>
        </div>
        <div className="machucados-tabela">
          {[
            { classe: 'grau-1', num: '1 Machucado',  desc: '−1 em Resistência' },
            { classe: 'grau-2', num: '2 Machucados', desc: '−2 Res. + Atordoado' },
            { classe: 'grau-3', num: '3 Machucados', desc: '−3 Res. + Incapacitado' },
            { classe: 'grau-4', num: '4 Machucados', desc: '−4 Res. + Ferimento Grave' },
          ].map((grau, i) => (
            <div key={i} className={`mach-grau ${grau.classe} ${i < machucados ? 'ativo' : ''}`}>
              <span className="grau-num">{grau.num}</span>
              <span className="grau-desc">{grau.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BlocoFoto({ personagem, ehMeuChar, uploadandoFoto, fotoAberta, setFotoAberta, handleFotoUpload }) {
  return (
    <div className="personagem-foto-wrapper" onClick={() => !ehMeuChar && setFotoAberta(true)}>
      {personagem?.foto
        ? <img src={personagem.foto} className="personagem-foto" alt="Personagem" />
        : <div className="foto-placeholder">🦸</div>
      }
      <div className="personagem-foto-overlay" />
      {ehMeuChar && (
        <label className="foto-upload-btn" title={uploadandoFoto ? 'Enviando...' : 'Alterar foto'}>
          {uploadandoFoto ? '⏳' : '📷'}
          <input type="file" accept="image/*" style={{ display: 'none' }}
            onChange={handleFotoUpload} disabled={uploadandoFoto} />
        </label>
      )}
      {!ehMeuChar && <div className="personagem-foto-hint">🔍</div>}
    </div>
  )
}

function BlocoDados({ atributos, defTotal, resistenciaTotal, poderesOfensivos, rolls, diceInput, setDiceInput, handleDiceInput, submitDice, rolarNotacao, notacaoMod, historicRef, inputRef, dadoIcon }) {
  return (
    <>
      <div className="dados-rapidos-titulo">Rolagens Rápidas</div>
      <div className="dados-rapidos">
        <button className="dados-btn-rapido"
          onClick={() => rolarNotacao('Iniciativa', notacaoMod(atributos?.consciencia ?? 0))}>
          ⚡ Iniciativa (+{atributos?.consciencia ?? 0})
        </button>
        <button className="dados-btn-rapido"
          onClick={() => rolarNotacao('Resistência', notacaoMod(resistenciaTotal))}>
          🛡 Resistência (+{resistenciaTotal})
        </button>
        <button className="dados-btn-rapido"
          onClick={() => rolarNotacao('Vontade', notacaoMod(defTotal('vontade', 'consciencia')))}>
          🧠 Vontade (+{defTotal('vontade', 'consciencia')})
        </button>
        <button className="dados-btn-rapido"
          onClick={() => rolarNotacao('Fortitude', notacaoMod(defTotal('fortitude', 'vigor')))}>
          💪 Fortitude (+{defTotal('fortitude', 'vigor')})
        </button>
        {poderesOfensivos.map(p => (
          <button key={p.id} className="dados-btn-rapido dados-btn-ataque"
            title={`Se acertar: alvo rola Resistência vs CD ${15 + p.graduacoes}`}
            onClick={() => rolarNotacao(`Ataque: ${p.nome}`, notacaoMod(atributos?.luta ?? 0))}>
            ⚔ {p.nome} (CD {15 + p.graduacoes})
          </button>
        ))}
      </div>
      <div className="dados-historico" ref={historicRef}>
        {rolls.length === 0 && (
          <div className="dados-historico-vazio">Os resultados das rolagens aparecem aqui</div>
        )}
        {rolls.map(r => <RollResult key={r.id} roll={r} />)}
      </div>
      <div className="dados-input-bar">
        <input ref={inputRef} className="dados-input"
          placeholder="Rolar dados  (ex: 1d20, 2d6+3, 1d20+5)"
          value={diceInput}
          onChange={e => setDiceInput(e.target.value)}
          onKeyDown={handleDiceInput} />
        <button className="dados-input-btn" onClick={submitDice} title="Rolar (Enter)">
          <img src={dadoIcon} alt="rolar" style={{ width: 20, height: 20, filter: 'invert(1)' }} />
        </button>
      </div>
    </>
  )
}

// ─── RollResult ─────────────────────────────────────────────────────────────

function RollResult({ roll }) {
  const corTotal = roll.critico ? '#f1c40f' : roll.fumble ? '#e74c3c' : roll.total >= 20 ? '#2ecc71' : 'white'
  const badge    = roll.critico ? '✦ CRÍTICO' : roll.fumble ? '✸ FUMBLE' : null

  return (
    <div className={`dado-resultado ${roll.critico ? 'dado-critico' : roll.fumble ? 'dado-fumble' : ''}`}>
      <div className="dado-resultado-header">
        <span className="dado-resultado-label">{roll.label}</span>
        <span className="dado-resultado-hora">{roll.horario}</span>
      </div>
      <div className="dado-resultado-corpo">
        <span className="dado-resultado-detalhes">{formatarPartes(roll.partes)}</span>
        <span className="dado-resultado-total" style={{ color: corTotal }}>
          = {roll.total}
          {badge && <span className="dado-badge">{badge}</span>}
        </span>
      </div>
    </div>
  )
}

export default FichaPersonagem