import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSessao } from '../contexts/SessaoContext'
import { useSocket } from '../contexts/SocketContext'
import api from '../services/api'
import dadoIcon from '../assets/dice-d20-svgrepo-com.svg'
import regras from '../data/regras_mm3e.json'
import ModalCriacaoNPC from '../components/ModalCriacaoNPC'
import './PainelMestre.css'
import './PainelMestre_mobile.css'
import ModalExportarFicha from '../components/ModalExportarFicha'

// ─── Constantes ────────────────────────────────────────────────────────────

const MAX_MACH   = 4
const CORES_MACH = ['#2ecc71', '#f1c40f', '#e67e22', '#c0392b', '#8b0000']
const STATUS_LABEL = [
  { classe: 'pm-status-ok',      texto: 'Saudável'        },
  { classe: 'pm-status-leve',    texto: 'Machucado'       },
  { classe: 'pm-status-medio',   texto: 'Atordoado'       },
  { classe: 'pm-status-grave',   texto: 'Incapacitado'    },
  { classe: 'pm-status-critico', texto: 'Ferimento Grave' },
]

const HAB_PARA_CHAVE = {
  'Força': 'forca', 'Vigor': 'vigor', 'Agilidade': 'agilidade',
  'Destreza': 'destreza', 'Luta': 'luta', 'Intelecto': 'intelecto',
  'Consciência': 'consciencia', 'Prontidão': 'consciencia', 'Presença': 'presenca',
}
const PERICIA_INFO = {}
regras.pericias.forEach(p => {
  PERICIA_INFO[p.nome] = {
    chave: HAB_PARA_CHAVE[p.habilidade_vinculada] ?? null,
    sigla: p.habilidade_vinculada?.substring(0, 3).toUpperCase() ?? '—',
  }
})

// ─── Dice helpers ──────────────────────────────────────────────────────────

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
  const d20s    = partes.filter(p => p.tipo === 'dado' && p.lados === 20).flatMap(p => p.resultados)
  const critico = d20s.includes(20)
  const fumble  = d20s.includes(1) && !critico
  return { total, partes, critico, fumble }
}

function formatarPartes(partes) {
  return partes.map(p => {
    if (p.tipo === 'dado') {
      const sinal = p.soma < 0 ? '−' : ''
      return `${sinal}${p.qtd}d${p.lados}(${p.resultados.join(',')})`
    }
    return p.valor >= 0 ? `+${p.valor}` : `${p.valor}`
  }).join(' ')
}

function notacaoMod(mod) {
  return mod !== 0 ? `1d20+${mod}` : '1d20'
}

// ─── Componente principal ──────────────────────────────────────────────────

function PainelMestre() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const socket     = useSocket()
  const { setSessaoAtiva } = useSessao()

  const [sessao,         setSessao]         = useState(null)
  const [personagens,    setPersonagens]    = useState([])
  const [carregando,     setCarregando]     = useState(true)
  const [copiado,        setCopiado]        = useState(false)
  const [settingsAberto, setSettingsAberto] = useState(false)
  const [modalFichaOffline, setModalFichaOffline] = useState(false)
  const [dadosFichaOffline, setDadosFichaOffline] = useState(null)
  const [modalNPC,       setModalNPC]       = useState(false)
  const [abaMobile, setAbaMobile] = useState('jogadores')
  const [liveRolls,      setLiveRolls]      = useState([])
  const [masterInput,    setMasterInput]    = useState('')

  const feedRef      = useRef(null)
  const masterRef    = useRef(null)

  const jogadores = personagens.filter(p => p.tipo !== 'npc')
  const npcs      = personagens.filter(p => p.tipo === 'npc')

  // ─── Carregar dados ──────────────────────────────────────────────────────

  useEffect(() => {
    async function carregar() {
      try {
        const resp = await api.get(`/sessoes/${id}/personagens`)
        setSessao(resp.data.sessao)
        setSessaoAtiva(resp.data.sessao)
        setPersonagens(resp.data.personagens)
      } catch (e) {
        console.error('Erro ao carregar painel:', e)
        if (e.response?.status === 403) navigate('/dashboard')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [id])

  // ─── Socket.io ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!socket) return
    socket.emit('join-session', Number(id))

    socket.on('machucados-update', ({ personagemId, machucados }) => {
      setPersonagens(prev => prev.map(p =>
        p.id === personagemId ? { ...p, machucados } : p
      ))
    })

    // Recebe rolagens dos jogadores
    socket.on('dice-roll-resultado', (rollData) => {
      setLiveRolls(prev => [...prev.slice(-99), { id: Date.now(), ...rollData }])
    })

    return () => {
      socket.off('machucados-update')
      socket.off('dice-roll-resultado')
    }
  }, [socket, id])

  // Scroll automático no feed
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [liveRolls])

  // ─── Rolagem do mestre ────────────────────────────────────────────────────

  function masterRolar(label, notacao, nomeRolante = 'Mestre') {
    const resultado = parseDados(notacao)
    if (!resultado) return

    const horario = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })

    const roll = {
      id:             Date.now(),
      label,
      total:          resultado.total,
      critico:        resultado.critico,
      fumble:         resultado.fumble,
      detalhes:       formatarPartes(resultado.partes),
      personagemNome: nomeRolante,
      horario,
    }

    // Adiciona no feed local
    setLiveRolls(prev => [...prev.slice(-99), roll])

    // Emite para os jogadores também verem
    if (socket) {
      socket.emit('dice-roll', { sessao_id: Number(id), ...roll })
    }
  }

  function handleMasterKey(e) { if (e.key === 'Enter') submitMasterDice() }
  function submitMasterDice() {
    if (!masterInput.trim()) return
    masterRolar(masterInput.trim(), masterInput.trim(), 'Mestre')
    setMasterInput('')
    masterRef.current?.focus()
  }

  // ─── Outras ações ─────────────────────────────────────────────────────────

  function copiarCodigo() {
    navigator.clipboard.writeText(sessao?.codigo?.toUpperCase() ?? '')
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const atualizarMachucados = useCallback(async (personagemId, novoValor) => {
    setPersonagens(prev => prev.map(p =>
      p.id === personagemId ? { ...p, machucados: novoValor } : p
    ))
    try {
      await api.patch(`/personagens/${personagemId}/machucados`, { machucados: novoValor })
    } catch (e) {
      console.error('Erro ao salvar machucados:', e)
      const resp = await api.get(`/sessoes/${id}/personagens`)
      setPersonagens(resp.data.personagens)
    }
  }, [id])

  async function salvarConfiguracao(campo, valor) {
    const anterior = sessao
    setSessao(prev => ({ ...prev, [campo]: valor }))
    try {
      await api.patch(`/sessoes/${id}/configuracoes`, { [campo]: valor })
    } catch (e) {
      console.error('Erro ao salvar configuração:', e)
      setSessao(anterior)
    }
  }

  function onNPCCriado() {
    api.get(`/sessoes/${id}/personagens`).then(resp => setPersonagens(resp.data.personagens))
  }

  async function deletarPersonagem(id) {
    try {
      await api.delete(`/personagens/${id}`)
      setPersonagens(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      console.error('Erro ao deletar personagem:', e)
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (carregando) {
    return (
      <div className="pm-loading">
        <div className="pm-loading-texto">Carregando painel do mestre...</div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="pm-wrapper">

      {/* HEADER */}
      <header className="pm-header">
        <div className="pm-header-esquerda">
          <button className="pm-btn-voltar" onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <div className="pm-header-sessao">
            <span className="pm-header-nome">{sessao?.nome ?? `Sessão ${id}`}</span>
            <span className="pm-header-np">NP {sessao?.nivel_poder}</span>
          </div>
        </div>
        <div className="pm-header-direita">
          <div className="pm-codigo-wrapper">
            <span className="pm-codigo-label">Código da sessão</span>
            <div className="pm-codigo-bloco">
              <span className="pm-codigo-valor">{sessao?.codigo?.toUpperCase()}</span>
              <button className="pm-codigo-copiar" onClick={copiarCodigo}>
                {copiado ? '✓ Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          <button
            className="pm-btn-exportar"
            title="Exportar dados da campanha em CSV"
            onClick={() => {
              const token = localStorage.getItem('token')
              const url   = `${import.meta.env.VITE_API_URL}/sessoes/${id}/exportar?token=${token}`
              const a     = document.createElement('a')
              a.href      = url
              a.download  = `campanha-${id}.csv`
              a.click()
            }}
          >
            ⬇ Exportar CSV
          </button>

          <button
            className={`pm-btn-settings ${settingsAberto ? 'pm-btn-settings-ativo' : ''}`}
            onClick={() => setSettingsAberto(s => !s)}
            title="Configurações"
          >⚙</button>
        </div>
      </header>

      {/* SETTINGS */}
      {settingsAberto && (
  <div className="pm-settings-panel">
    <div className="pm-settings-titulo">Configurações da Sessão</div>

    <div className="pm-setting-item">
      <div className="pm-setting-info">
        <span className="pm-setting-nome">Jogadores podem alterar próprios machucados</span>
        <span className="pm-setting-desc">Se ativado, jogadores podem aumentar e diminuir a própria barra de vida.</span>
      </div>
      <button
        className={`pm-toggle ${sessao?.jogadores_podem_alterar_machucados ? 'pm-toggle-on' : ''}`}
        onClick={() => salvarConfiguracao('jogadores_podem_alterar_machucados', !sessao?.jogadores_podem_alterar_machucados)}
      >
        {sessao?.jogadores_podem_alterar_machucados ? 'Ativado' : 'Desativado'}
      </button>
    </div>

          <div className="pm-setting-item">
            <div className="pm-setting-info">
              <span className="pm-setting-nome">Jogadores podem editar a própria ficha</span>
              <span className="pm-setting-desc">Se ativado, jogadores podem editar atributos, poderes e perícias do próprio personagem.</span>
            </div>
            <button
              className={`pm-toggle ${sessao?.jogadores_podem_editar_ficha ? 'pm-toggle-on' : ''}`}
              onClick={() => salvarConfiguracao('jogadores_podem_editar_ficha', !sessao?.jogadores_podem_editar_ficha)}
            >
              {sessao?.jogadores_podem_editar_ficha ? 'Ativado' : 'Desativado'}
            </button>
          </div>

          <div className="pm-settings-nota">Mais configurações em breve (integração Owlbear, rolagem pública, etc.)</div>
        </div>
      )}

      {/* LAYOUT COM SIDEBAR */}
      <div className="pm-layout">

        {/* CONTEÚDO PRINCIPAL */}
        <main className="pm-main">

          {/* JOGADORES */}
          <div className="pm-secao-bloco">
            <div className="pm-secao-header">
              <h2 className="pm-secao-nome">Jogadores</h2>
              <span className="pm-secao-count">{jogadores.length} personagem{jogadores.length !== 1 ? 's' : ''}</span>
            </div>
            {jogadores.length === 0 ? (
              <div className="pm-vazio">
                <p>Nenhum jogador entrou ainda.</p>
                <p>Compartilhe o código <strong className="pm-codigo-destaque">{sessao?.codigo?.toUpperCase()}</strong></p>
              </div>
            ) : (
              <div className="pm-grade">
                {jogadores.map(p => (
                  <CardPersonagem key={p.id} personagem={p} mostrarJogador
                    sessaoId={id}
                    onMachucadosChange={atualizarMachucados}
                    onRoll={masterRolar}
                    onDeletar={deletarPersonagem}
                  />
                ))}
              </div>
            )}
          </div>

          {/* NPCs */}
          <div className="pm-secao-bloco">
            <div className="pm-secao-header">
              <h2 className="pm-secao-nome">NPCs</h2>
              <span className="pm-secao-count">{npcs.length} NPC{npcs.length !== 1 ? 's' : ''}</span>
              <button className="pm-btn-criar-npc" onClick={() => setModalNPC(true)}>+ Criar NPC</button>
              <button className="pm-btn-criar-npc" style={{ backgroundColor: '#111', borderColor: '#333', color: '#aaa' }}
                onClick={() => setModalFichaOffline(true)}>
                📄 Criar Ficha Offline
              </button>
            </div>
            {npcs.length === 0 ? (
              <div className="pm-vazio pm-vazio-npc">
                <p>Nenhum NPC criado.</p>
              </div>
            ) : (
              <div className="pm-grade">
                {npcs.map(p => (
                  <CardPersonagem key={p.id} personagem={p} mostrarJogador={false}
                    sessaoId={id}
                    onMachucadosChange={atualizarMachucados}
                    onRoll={masterRolar}
                    onDeletar={deletarPersonagem}
                  />
                ))}
              </div>
            )}
          </div>

        </main>

        {/* SIDEBAR — DADOS + FEED */}
        <aside className="pm-sidebar">

          <div className="pm-sidebar-secao-titulo">🎲 Rolar Dados</div>

          {/* Input do mestre */}
          <div className="pm-sidebar-input-area">
            <input
              ref={masterRef}
              className="pm-sidebar-input"
              placeholder="1d20, 2d6+3, 1d20+5..."
              value={masterInput}
              onChange={e => setMasterInput(e.target.value)}
              onKeyDown={handleMasterKey}
            />
            <button className="pm-sidebar-input-btn" onClick={submitMasterDice} title="Rolar (Enter)">
              <img src={dadoIcon} alt="rolar" style={{ width: 16, filter: 'invert(1)' }} />
            </button>
          </div>

          <div className="pm-sidebar-secao-titulo" style={{ marginTop: 12 }}>
            📜 Rolagens ao Vivo
            {liveRolls.length > 0 && (
              <button className="pm-feed-limpar" onClick={() => setLiveRolls([])}>Limpar</button>
            )}
          </div>

          {/* Feed de rolagens */}
          <div className="pm-sidebar-feed" ref={feedRef}>
            {liveRolls.length === 0 ? (
              <div className="pm-feed-vazio">As rolagens de jogadores e mestre aparecerão aqui</div>
            ) : (
              liveRolls.map(r => <FeedRoll key={r.id} roll={r} />)
            )}
          </div>

        </aside>
      </div>

      {/* ══ MOBILE CONTENT ══ */}
        <div className="pm-mobile-content">

          {/* ABA: JOGADORES */}
          {abaMobile === 'jogadores' && (
            <div className="pm-mobile-aba-content">
              <div className="pm-mobile-secao-header">
                <h2>Jogadores</h2>
                <span className="pm-secao-count">{jogadores.length} personagem{jogadores.length !== 1 ? 's' : ''}</span>
              </div>
              {jogadores.length === 0 ? (
                <div className="pm-vazio">
                  <p>Nenhum jogador entrou ainda.</p>
                  <p>Compartilhe o código <strong className="pm-codigo-destaque">{sessao?.codigo?.toUpperCase()}</strong></p>
                </div>
              ) : (
                <div className="pm-grade">
                  {jogadores.map(p => (
                    <CardPersonagem key={p.id} personagem={p} mostrarJogador
                      sessaoId={id}
                      onMachucadosChange={atualizarMachucados}
                      onRoll={masterRolar}
                      onDeletar={deletarPersonagem}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA: NPCS */}
          {abaMobile === 'npcs' && (
            <div className="pm-mobile-aba-content">
              <div className="pm-mobile-secao-header">
                <h2>NPCs</h2>
                <span className="pm-secao-count">{npcs.length} NPC{npcs.length !== 1 ? 's' : ''}</span>
                <button className="pm-btn-criar-npc" onClick={() => setModalNPC(true)}>+ Criar NPC</button>
                <button className="pm-btn-criar-npc" style={{ backgroundColor: '#111', borderColor: '#333', color: '#aaa' }}
                  onClick={() => setModalFichaOffline(true)}>
                  📄 Offline
                </button>
              </div>
              {npcs.length === 0 ? (
                <div className="pm-vazio pm-vazio-npc"><p>Nenhum NPC criado.</p></div>
              ) : (
                <div className="pm-grade">
                  {npcs.map(p => (
                    <CardPersonagem key={p.id} personagem={p} mostrarJogador={false}
                      sessaoId={id}
                      onMachucadosChange={atualizarMachucados}
                      onRoll={masterRolar}
                      onDeletar={deletarPersonagem}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA: DADOS */}
          {abaMobile === 'dados' && (
            <div className="pm-mobile-aba-content pm-mobile-dados">
              <div className="pm-sidebar-secao-titulo">🎲 Rolar Dados</div>
              <div className="pm-sidebar-input-area">
                <input
                  ref={masterRef}
                  className="pm-sidebar-input"
                  placeholder="1d20, 2d6+3, 1d20+5..."
                  value={masterInput}
                  onChange={e => setMasterInput(e.target.value)}
                  onKeyDown={handleMasterKey}
                />
                <button className="pm-sidebar-input-btn" onClick={submitMasterDice}>
                  <img src={dadoIcon} alt="rolar" style={{ width: 16, filter: 'invert(1)' }} />
                </button>
              </div>
              <div className="pm-sidebar-secao-titulo" style={{ marginTop: 12 }}>
                📜 Rolagens ao Vivo
                {liveRolls.length > 0 && (
                  <button className="pm-feed-limpar" onClick={() => setLiveRolls([])}>Limpar</button>
                )}
              </div>
              <div className="pm-sidebar-feed" ref={feedRef}>
                {liveRolls.length === 0
                  ? <div className="pm-feed-vazio">As rolagens aparecerão aqui</div>
                  : liveRolls.map(r => <FeedRoll key={r.id} roll={r} />)
                }
              </div>
            </div>
          )}

          {/* ABA: CONFIG */}
          {abaMobile === 'config' && (
            <div className="pm-mobile-aba-content pm-mobile-config">
              <div className="pm-settings-titulo">Configurações da Sessão</div>
              <div className="pm-setting-item">
                <div className="pm-setting-info">
                  <span className="pm-setting-nome">Jogadores podem alterar machucados</span>
                  <span className="pm-setting-desc">Jogadores podem aumentar e diminuir a própria barra de vida.</span>
                </div>
                <button
                  className={`pm-toggle ${sessao?.jogadores_podem_alterar_machucados ? 'pm-toggle-on' : ''}`}
                  onClick={() => salvarConfiguracao('jogadores_podem_alterar_machucados', !sessao?.jogadores_podem_alterar_machucados)}
                >
                  {sessao?.jogadores_podem_alterar_machucados ? 'Ativado' : 'Desativado'}
                </button>
              </div>
              <div className="pm-setting-item">
                <div className="pm-setting-info">
                  <span className="pm-setting-nome">Jogadores podem editar a própria ficha</span>
                  <span className="pm-setting-desc">Jogadores podem editar atributos, poderes e perícias.</span>
                </div>
                <button
                  className={`pm-toggle ${sessao?.jogadores_podem_editar_ficha ? 'pm-toggle-on' : ''}`}
                  onClick={() => salvarConfiguracao('jogadores_podem_editar_ficha', !sessao?.jogadores_podem_editar_ficha)}
                >
                  {sessao?.jogadores_podem_editar_ficha ? 'Ativado' : 'Desativado'}
                </button>
              </div>
              <div className="pm-settings-nota">Mais configurações em breve (integração Owlbear, etc.)</div>
            </div>
          )}

        </div>

        {/* ══ BOTTOM TAB BAR ══ */}
        <nav className="pm-mobile-tab-bar">
          {[
            { id: 'jogadores', icone: '⚔', label: 'Jogadores', count: jogadores.length },
            { id: 'npcs',      icone: '👾', label: 'NPCs',      count: npcs.length      },
            { id: 'dados',     icone: '🎲', label: 'Dados',     count: liveRolls.length },
            { id: 'config',    icone: '⚙',  label: 'Config',    count: 0                },
          ].map(tab => (
            <button
              key={tab.id}
              className={`pm-mobile-tab ${abaMobile === tab.id ? 'ativa' : ''}`}
              onClick={() => setAbaMobile(tab.id)}
            >
              {tab.count > 0 && <span className="pm-mobile-tab-badge">{tab.count > 9 ? '9+' : tab.count}</span>}
              <span className="pm-mobile-tab-icone">{tab.icone}</span>
              <span className="pm-mobile-tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>    
      
      {/* MODAL NPC */}
      {modalNPC && (
        <ModalCriacaoNPC sessaoId={id} onFechar={() => setModalNPC(false)} onNPCCriado={onNPCCriado} />
      )}

      {/* MODAL FICHA OFFLINE */}
      {modalFichaOffline && (
        <ModalCriacaoNPC
          sessaoId={id}
          modoOffline={true}
          onFechar={() => { setModalFichaOffline(false); setDadosFichaOffline(null) }}
          onNPCCriado={() => {}}
          onExportarOffline={(dados) => {
            setDadosFichaOffline(dados)
            setModalFichaOffline(false)
          }}
        />
      )}

      {/* MODAL EXPORTAR FICHA OFFLINE */}
      {dadosFichaOffline && (
        <ModalExportarFicha
          personagem={{ nome: dadosFichaOffline.nome, tipo: 'npc' }}
          atributos={dadosFichaOffline.atributos}
          pericias={[]}
          vantagens={[]}
          poderes={dadosFichaOffline.poderes}
          complicacoes={[]}
          sessao={sessao}
          onFechar={() => setDadosFichaOffline(null)}
        />
      )}

    </div>
  )
}

// ─── Card de personagem ────────────────────────────────────────────────────

function CardPersonagem({ personagem, mostrarJogador, sessaoId, onMachucadosChange, onRoll, onDeletar }) {
  const atr = personagem.atributo
  const [periciasAbertas,   setPericiasAbertas]   = useState(false)
  const [fotoUrl,           setFotoUrl]           = useState(personagem.foto)
  const [uploadando,        setUploadando]        = useState(false)
  const [confirmarDeletar,  setConfirmarDeletar]  = useState(false) 
  const [temBarra,          setTemBarra]          = useState(     
    personagem.tipo !== 'npc' || (personagem.machucados ?? 0) > 0
  )
  
  const defEsquiva     = (atr?.agilidade   ?? 0) + (atr?.esquiva   ?? 0)
  const defAparar      = (atr?.luta        ?? 0) + (atr?.aparar    ?? 0)
  const defFortitude   = (atr?.vigor       ?? 0) + (atr?.fortitude ?? 0)
  const defVontade     = (atr?.consciencia ?? 0) + (atr?.vontade   ?? 0)
  const poderProtecao  = personagem.poderes?.find(p =>
    p.efeito_base?.toLowerCase().includes('proteção') ||
    p.efeito_base?.toLowerCase().includes('protecao') ||
    p.nome?.toLowerCase().includes('proteção')
  )
  const defResistencia = (atr?.vigor ?? 0) + (poderProtecao?.graduacoes ?? 0)

  const poderesOfensivos = personagem.poderes?.filter(p =>
    p.efeito_base?.toLowerCase().includes('dano') ||
    p.efeito_base?.toLowerCase().includes('aflição')
  ) ?? []

  const mach       = personagem.machucados ?? 0
  const pct        = ((MAX_MACH - mach) / MAX_MACH) * 100
  const statusInfo = STATUS_LABEL[mach]

  function alterar(delta) {
    const novo = Math.min(MAX_MACH, Math.max(0, mach + delta))
    if (novo !== mach) onMachucadosChange(personagem.id, novo)
  }

  // Rolar ataque de um poder
  function rolarAtaque(poder) {
    const mod   = atr?.luta ?? 0
    const label = `${personagem.nome}: Ataque — ${poder.nome}`
    onRoll(label, notacaoMod(mod), personagem.nome)
  }

  // Rolar perícia
  function rolarPericia(nomePericia) {
    const info = PERICIA_INFO[nomePericia]
    const base = info?.chave ? (atr?.[info.chave] ?? 0) : 0
    const label = `${personagem.nome}: ${nomePericia}`
    onRoll(label, notacaoMod(base), personagem.nome)
  }

  return (
    <div className={`pm-card ${mach >= 3 ? 'pm-card-perigo' : ''}`}>
          <div className="pm-card-acoes">
            <button
              className="pm-card-acao-btn"
              title="Abrir ficha completa"
              onClick={() => window.open(`/sessao/${sessaoId}/ficha?personagemId=${personagem.id}`, '_blank')}
            >
              📋
            </button>

            {!confirmarDeletar ? (
              <button
                className="pm-card-acao-btn pm-card-acao-deletar"
                title="Remover personagem"
                onClick={() => setConfirmarDeletar(true)}
              >
                🗑
              </button>
            ) : (
              <div className="pm-card-confirmar">
                <span>Remover?</span>
                <button className="pm-card-confirmar-sim" onClick={() => onDeletar(personagem.id)}>Sim</button>
                <button className="pm-card-confirmar-nao" onClick={() => setConfirmarDeletar(false)}>Não</button>
              </div>
            )}
          </div>

          <div className="pm-card-foto" style={{ position: 'relative' }}>
      {fotoUrl
        ? <img src={fotoUrl} alt={personagem.nome} />
        : <div className="pm-card-foto-placeholder">{personagem.tipo === 'npc' ? '👾' : '🦸'}</div>
      }

      {personagem.tipo === 'npc' && (
        <label className="pm-card-foto-upload" title={uploadando ? 'Enviando...' : 'Alterar foto'}>
          {uploadando ? '⏳' : '📷'}
          <input type="file" accept="image/*" style={{ display: 'none' }}
            disabled={uploadando}
            onChange={async (e) => {
              const file = e.target.files[0]
              if (!file) return
              setUploadando(true)
              try {
                const form = new FormData()
                form.append('foto', file)
                const resp = await api.post(`/personagens/${personagem.id}/foto`, form, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                })
                setFotoUrl(resp.data.url)
              } catch (err) {
                console.error('Erro ao fazer upload:', err)
              } finally {
                setUploadando(false)
              }
            }}
          />
        </label>
      )}
          </div>

      {/* Machucados */}
      {temBarra ? (
        <div className="pm-mach-secao">
          <div className="pm-mach-barra-bg">
            <div className="pm-mach-barra-fill"
              style={{ width: `${pct}%`, backgroundColor: CORES_MACH[mach] }} />
            <span className="pm-mach-barra-texto">{mach} / {MAX_MACH} machucados</span>
          </div>
          <div className="pm-mach-controles">
            <button className="pm-mach-btn" onClick={() => alterar(-4)} title="Curar tudo">«</button>
            <button className="pm-mach-btn" onClick={() => alterar(-1)}>− Curar</button>
            <button className="pm-mach-btn pm-mach-btn-dano" onClick={() => alterar(+1)}>+ Dano</button>
            <button className="pm-mach-btn pm-mach-btn-dano" onClick={() => alterar(+4)} title="Incapacitar">»</button>
          </div>
        </div>
      ) : (
      personagem.tipo === 'npc' && (
        <button className="pm-card-add-barra" onClick={() => setTemBarra(true)}>
          + Adicionar barra de vida
        </button>
      )
    )}

      {/* Defesas */}
      <div className="pm-secao-titulo">Defesas</div>
      <div className="pm-defesas-grid">
        {[
          { label: 'ESQ', valor: (atr?.agilidade ?? 0) + (atr?.esquiva ?? 0) },
          { label: 'APA', valor: (atr?.luta ?? 0) + (atr?.aparar ?? 0) },
        ].map(({ label, valor }) => (
          <div key={label} className="pm-def-item">
            <span className="pm-def-label">{label}</span>
            <span className="pm-def-valor" style={{ color: '#cc3333' }}>{valor}</span>
          </div>
        ))}

        {[
          { label: 'FOR', valor: (atr?.vigor ?? 0) + (atr?.fortitude ?? 0),     mod: (atr?.vigor ?? 0) + (atr?.fortitude ?? 0) },
          { label: 'RES', valor: (atr?.vigor ?? 0),                              mod: atr?.vigor ?? 0 },
          { label: 'VON', valor: (atr?.consciencia ?? 0) + (atr?.vontade ?? 0), mod: (atr?.consciencia ?? 0) + (atr?.vontade ?? 0) },
        ].map(({ label, valor, mod }) => (
          <div key={label} className="pm-def-item" style={{ cursor: 'pointer' }}
            title={`Rolar ${label}: 1d20+${mod}`}
            onClick={() => onRoll(`${personagem.nome} — ${label}`, mod >= 0 ? `1d20+${mod}` : '1d20')}
          >
            <span className="pm-def-label">{label}</span>
            <span className="pm-def-valor">+{valor}</span>
            <img src={dadoIcon} alt="" style={{ width: 11, filter: 'invert(1)', opacity: 0.5 }} />
          </div>
        ))}
      </div>

      {/* Ataques */}
      {poderesOfensivos.length > 0 && (
        <>
          <div className="pm-secao-titulo">Ataques</div>
          <div className="pm-poderes-lista">
            {poderesOfensivos.map(p => (
              <div key={p.id} className="pm-poder-linha pm-poder-linha-clicavel"
                onClick={() => rolarAtaque(p)}
                title="Clique para rolar ataque">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img src={dadoIcon} alt="" style={{ width: 12, filter: 'invert(1)', opacity: 0.6 }} />
                  <span className="pm-poder-nome">{p.nome}</span>
                </div>
                <span className="pm-poder-cd">CD {15 + p.graduacoes}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Perícias — só para NPCs */}
      {personagem.tipo === 'npc' && (
        <>
          <div
            className="pm-secao-titulo pm-secao-titulo-clicavel"
            onClick={() => setPericiasAbertas(v => !v)}
          >
            Perícias {periciasAbertas ? '▲' : '▼'}
          </div>
          {periciasAbertas && (
            <div className="pm-pericias-npc">
              {regras.pericias.map(p => {
                const info = PERICIA_INFO[p.nome]
                const base = info?.chave ? (atr?.[info.chave] ?? 0) : 0
                return (
                  <div key={p.nome} className="pm-pericia-npc-linha"
                    onClick={() => rolarPericia(p.nome)}
                    title={`Rolar ${p.nome}: 1d20 + ${base}`}>
                    <img src={dadoIcon} alt="" style={{ width: 11, filter: 'invert(1)', opacity: 0.5 }} />
                    <span className="pm-pericia-npc-nome">{p.nome}</span>
                    <span className="pm-pericia-npc-bonus">+{base}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Complicações */}
      {personagem.complicacoes?.length > 0 && (
        <>
          <div className="pm-secao-titulo">Complicações</div>
          <div className="pm-complicacoes">
            {personagem.complicacoes.map(c => (
              <span key={c.id} className="pm-comp-tag" title={c.descricao}>{c.titulo}</span>
            ))}
          </div>
        </>
      )}

    </div>
  )
}

// ─── Card de resultado no feed ─────────────────────────────────────────────

function FeedRoll({ roll }) {
  const cor = roll.critico
    ? '#f1c40f'
    : roll.fumble
      ? '#e74c3c'
      : roll.total >= 20 ? '#2ecc71' : '#ccc'

  return (
    <div className={`pm-feed-roll ${roll.critico ? 'pm-feed-critico' : roll.fumble ? 'pm-feed-fumble' : ''}`}>
      <div className="pm-feed-header">
        <span className="pm-feed-nome">{roll.personagemNome}</span>
        <span className="pm-feed-label">{roll.label}</span>
        <span className="pm-feed-hora">{roll.horario}</span>
      </div>
      <div className="pm-feed-corpo">
        <span className="pm-feed-detalhes">{roll.detalhes}</span>
        <span className="pm-feed-total" style={{ color: cor }}>
          = {roll.total}
          {roll.critico && <span className="pm-feed-badge pm-feed-badge-critico">✦ CRÍTICO</span>}
          {roll.fumble  && <span className="pm-feed-badge pm-feed-badge-fumble">✸ FUMBLE</span>}
        </span>
      </div>
    </div>
  )
}

export default PainelMestre