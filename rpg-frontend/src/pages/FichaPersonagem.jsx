import { useState, useEffect, useRef, useCallback } from 'react'
import { useSessao } from '../contexts/SessaoContext'
import { useSocket } from '../contexts/SocketContext'
import api from '../services/api'
import dadoIcon from '../assets/dice-d20-svgrepo-com.svg'
import './FichaPersonagem.css'
import { jwtDecode } from 'jwt-decode'
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

// As 13 perícias fixas do livro (Combate Corpo a Corpo/à Distância já são
// cobertas pela seção Ofensivo via Luta/Destreza, então não entram aqui).
// "Especialidade" fica de fora da lista fixa porque sempre vem com um
// subtipo (ex: "Especialidade (Ciências)") — cada uma digitada vira sua
// própria linha, junto de qualquer outra perícia customizada que o jogador
// escrever e que não bata com nenhum nome fixo.
const PERICIAS_FIXAS = [
  { nome: 'Acrobacia',       chave: 'agilidade',   soTreinado: false },
  { nome: 'Atletismo',       chave: 'forca',       soTreinado: false },
  { nome: 'Enganação',       chave: 'presenca',    soTreinado: false },
  { nome: 'Furtividade',     chave: 'agilidade',   soTreinado: false },
  { nome: 'Intimidação',     chave: 'presenca',    soTreinado: false },
  { nome: 'Intuição',        chave: 'consciencia', soTreinado: false },
  { nome: 'Investigação',    chave: 'intelecto',   soTreinado: true  },
  { nome: 'Percepção',       chave: 'consciencia', soTreinado: false },
  { nome: 'Persuasão',       chave: 'presenca',    soTreinado: false },
  { nome: 'Prestidigitação', chave: 'destreza',    soTreinado: false },
  { nome: 'Tecnologia',      chave: 'intelecto',   soTreinado: true  },
  { nome: 'Tratamento',      chave: 'intelecto',   soTreinado: true  },
  { nome: 'Veículos',        chave: 'destreza',    soTreinado: false },
]

function hexParaRgba(hex, alpha) {
  const limpo = (hex || '#8b0000').replace('#', '')
  const expandido = limpo.length === 3 ? limpo.split('').map(c => c + c).join('') : limpo
  const bigint = parseInt(expandido, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function normalizarNomePericia(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

// ─── Parser de perícias direto do texto livre ──────────────────────────────
// Independente do que o backend guarda em pericias_parsed — assim, mesmo que
// o parser do servidor tenha alguma falha de formato, a ficha continua
// reconhecendo corretamente o que o jogador escreveu.

// Separa por vírgulas que não estão dentro de parênteses
// (ex: não quebra "Especialidade (Ciências, Física)" ao meio)
function separarItensPericias(texto) {
  if (!texto) return []
  const itens = []
  let atual = ''
  let profundidade = 0
  for (const char of texto) {
    if (char === '(') profundidade++
    if (char === ')') profundidade = Math.max(0, profundidade - 1)
    if (char === ',' && profundidade === 0) { itens.push(atual); atual = '' }
    else atual += char
  }
  if (atual.trim()) itens.push(atual)
  return itens.map(s => s.trim()).filter(Boolean)
}

// Extrai {nome, bonus} de um item cru, usando o ÚLTIMO "(+N)"/"(-N)"/"(N)"
// da string como o bônus — funciona mesmo com parênteses extras no meio,
// como em "Especialidade (agricultura) 8 (+9)"
function parsearItemPericia(itemBruto) {
  const ocorrencias = [...itemBruto.matchAll(/\(\s*([+-]?\d+)\s*\)/g)]
  if (ocorrencias.length === 0) return null
  const ultima = ocorrencias[ocorrencias.length - 1]
  const bonus  = parseInt(ultima[1], 10)
  if (Number.isNaN(bonus)) return null
  let nome = itemBruto.slice(0, ultima.index).trim()
  nome = nome.replace(/\s+\d+\s*$/, '').trim() // tira a graduação solta no final (ex: "Atletismo 4" → "Atletismo")
  if (!nome) return null
  return { nome, bonus }
}

function distanciaEdicao(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

// Acha a perícia fixa correspondente a um nome digitado, tolerando acentos,
// texto extra (ex: variantes de combate) e pequenos erros de digitação.
function encontrarPericiaFixa(nomeDigitado) {
  const alvo = normalizarNomePericia(nomeDigitado)
  if (!alvo || alvo.startsWith('especialidade')) return null // Especialidade sempre vira linha própria

  const exata = PERICIAS_FIXAS.find(fx => normalizarNomePericia(fx.nome) === alvo)
  if (exata) return exata

  const porPrefixo = PERICIAS_FIXAS.find(fx => {
    const n = normalizarNomePericia(fx.nome)
    return alvo.startsWith(n) || n.startsWith(alvo)
  })
  if (porPrefixo) return porPrefixo

  let melhor = null, menorDist = Infinity
  for (const fx of PERICIAS_FIXAS) {
    const n = normalizarNomePericia(fx.nome)
    const dist = distanciaEdicao(alvo, n)
    if (dist < menorDist) { menorDist = dist; melhor = fx }
  }
  const limite = melhor ? Math.max(1, Math.floor(normalizarNomePericia(melhor.nome).length * 0.3)) : 0
  return menorDist <= limite ? melhor : null
}

// ─── Parser de dados ────────────────────────────────────────────────────────

function parseDados(notacao) {
  const s = notacao.trim().toLowerCase().replace(/\s+/g, '')
  if (!s) return null
  let total = 0
  const partes = []
  const tokens = s.split(/(?=[+-])/)
  for (const token of tokens) {
    const sinal = token.startsWith('-') ? -1 : 1
    const parte = token.replace(/^[+-]/, '')
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
      return `${sinal}${p.qtd}d${p.lados}(${p.resultados.join(', ')})`
    }
    return p.valor >= 0 ? `+${p.valor}` : `${p.valor}`
  }).join(' ')
}

// ─── Componente Principal ──────────────────────────────────────────────────

function FichaPersonagem() {
  const { id }            = useParams()
  const [searchParams]    = useSearchParams()
  const personagemIdParam = searchParams.get('personagemId')
  const navigate          = useNavigate()
  const { sessaoAtiva, setSessaoAtiva } = useSessao()
  const historicRef       = useRef(null)
  const inputRef          = useRef(null)
  const socket            = useSocket()

  const [abaMobile,         setAbaMobile]         = useState('combate')
  const [personagem,        setPersonagem]         = useState(null)
  const [sessao,            setSessao]             = useState(sessaoAtiva)
  const [carregando,        setCarregando]         = useState(true)
  const [semPersonagem,     setSemPersonagem]      = useState(false)
  const [machucados,        setMachucados]         = useState(0)
  const [rolls,             setRolls]              = useState([])
  const [diceInput,         setDiceInput]          = useState('')
  const [jogsPodemAlterar,      setJogsPodemAlterar]      = useState(false)
  const [jogsPodeEditar,        setJogsPodeEditar]        = useState(false)
  const [jogsPodePersonalizar,  setJogsPodePersonalizar]  = useState(false)
  const [uploadandoFoto,        setUploadandoFoto]        = useState(false)

  // Painel de aparência (engrenagem)
  const [painelAberto,   setPainelAberto]   = useState(false)
  const [salvandoAparencia, setSalvandoAparencia] = useState(false)

  // Controle da imagem de fundo
  const [imgPos,   setImgPos]   = useState({ x: 50, y: 20, zoom: 1.0 })
  const [ajustando, setAjustando] = useState(false)
  const dragRef    = useRef(null)

  const token     = localStorage.getItem('token')
  const meuUserId = token ? jwtDecode(token).id : null
  const ehMeuChar = !personagemIdParam && personagem?.usuario_id === meuUserId

  // ─── Carregar ────────────────────────────────────────────────────────────

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
          setMachucados(dados.machucados ?? 0)
          if (dados.imagem_posicao) setImgPos(dados.imagem_posicao)
          setJogsPodemAlterar(true)
          setJogsPodePersonalizar(true)
          return
        }

        const resp  = await api.get(`/sessoes/${id}/meu-personagem`)
        const dados = resp.data.personagem
        if (!dados) { setSemPersonagem(true); return }
        setPersonagem(dados)
        setMachucados(dados.machucados ?? 0)
        if (dados.imagem_posicao) setImgPos(dados.imagem_posicao)
        if (resp.data.configuracoes) {
          setJogsPodemAlterar(resp.data.configuracoes.jogadores_podem_alterar_machucados ?? false)
          setJogsPodeEditar(resp.data.configuracoes.jogadores_podem_editar_ficha ?? false)
          setJogsPodePersonalizar(resp.data.configuracoes.jogadores_podem_personalizar_ficha ?? false)
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
    if (historicRef.current) historicRef.current.scrollTop = historicRef.current.scrollHeight
  }, [rolls])

  useEffect(() => {
    if (!socket || !personagem) return
    socket.emit('join-session', Number(id))
    socket.on('machucados-update', ({ personagemId, machucados }) => {
      if (personagemId === personagem.id) setMachucados(machucados)
    })
    socket.on('settings-update', ({ jogadores_podem_alterar_machucados, jogadores_podem_editar_ficha, jogadores_podem_personalizar_ficha }) => {
      setJogsPodemAlterar(jogadores_podem_alterar_machucados)
      setJogsPodeEditar(jogadores_podem_editar_ficha)
      setJogsPodePersonalizar(jogadores_podem_personalizar_ficha)
    })
    return () => { socket.off('machucados-update'); socket.off('settings-update') }
  }, [socket, id, personagem])

  // ─── Imagem de fundo — arrastar para reposicionar ─────────────────────

  function iniciarAjuste(e) {
    if (!ajustando) return
    e.preventDefault()
    const startX  = e.clientX ?? e.touches?.[0]?.clientX
    const startY  = e.clientY ?? e.touches?.[0]?.clientY
    const startPos = { ...imgPos }

    function onMove(ev) {
      const cx = ev.clientX ?? ev.touches?.[0]?.clientX
      const cy = ev.clientY ?? ev.touches?.[0]?.clientY
      const dx = (cx - startX) / 5
      const dy = (cy - startY) / 5
      setImgPos(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100, startPos.x - dx)),
        y: Math.max(0, Math.min(100, startPos.y - dy)),
      }))
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
      salvarPosicao()
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  function ajustarZoom(delta) {
    setImgPos(prev => {
      const novo = { ...prev, zoom: Math.max(0.5, Math.min(3.0, prev.zoom + delta)) }
      return novo
    })
  }

  async function salvarPosicao() {
    if (!personagem) return
    try {
      await api.patch(`/personagens/${personagem.id}/imagem-posicao`, imgPos)
    } catch (e) { console.error('Erro ao salvar posição da imagem:', e) }
  }

  // ─── Rolagem ─────────────────────────────────────────────────────────────

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

  function notacaoMod(mod) { return mod !== 0 ? `1d20+${mod}` : '1d20' }

  function handleDiceInput(e) { if (e.key === 'Enter') submitDice() }
  function submitDice() {
    if (!diceInput.trim()) return
    rolarNotacao(diceInput.trim(), diceInput.trim())
    setDiceInput('')
    inputRef.current?.focus()
  }

  // ─── Machucados ──────────────────────────────────────────────────────────

  const pct         = ((MAX_MACH - machucados) / MAX_MACH) * 100
  const statusAtual = STATUS_INFO[machucados]

  async function alterarMachucados(delta) {
    if (!jogsPodemAlterar) return
    const novo = Math.min(MAX_MACH, Math.max(0, machucados + delta))
    setMachucados(novo)
    try {
      await api.patch(`/personagens/${personagem.id}/machucados`, { machucados: novo })
    } catch (e) { console.error('Erro ao salvar machucados:', e) }
  }

  // ─── Upload de foto ───────────────────────────────────────────────────────

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
    } catch (e) { console.error('Erro ao fazer upload:', e) }
    finally { setUploadandoFoto(false) }
  }

  // ─── Aparência (cor primária/secundária + tema dos blocos) ────────────────

  function mudarAparenciaLocal(campo, valor) {
    setPersonagem(prev => ({ ...prev, [campo]: valor }))
  }

  async function salvarAparencia() {
    if (!personagem) return
    setSalvandoAparencia(true)
    try {
      await api.patch(`/personagens/${personagem.id}/aparencia`, {
        cor_primaria:   personagem.cor_primaria,
        cor_secundaria: personagem.cor_secundaria,
        tema_blocos:    personagem.tema_blocos,
      })
    } catch (e) {
      console.error('Erro ao salvar aparência:', e)
    } finally {
      setSalvandoAparencia(false)
    }
  }

  // ─── Perícias parseadas ───────────────────────────────────────────────────

  function rolarPericia(nome, bonus) {
    rolarNotacao(nome, notacaoMod(bonus))
  }

  // ─── Derivados de combate ─────────────────────────────────────────────────

  const p = personagem ?? {}
  const resistenciaTotal = (p.vigor ?? 0) + (p.resistencia ?? 0)

  // ─── Loading / sem personagem ─────────────────────────────────────────────

  if (carregando) return (
    <div style={{ color: 'white', padding: 40, textAlign: 'center', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
      Carregando ficha...
    </div>
  )

  if (semPersonagem) return (
    <div style={{ color: 'white', backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>Você ainda não tem um personagem nesta sessão.</p>
      <button onClick={() => navigate(`/sessao/${id}/criar-personagem`)}
        style={{ padding: '12px 28px', backgroundColor: '#8b0000', color: 'white', border: 'none', borderRadius: 6, fontSize: '1rem', cursor: 'pointer' }}>
        Criar Personagem
      </button>
    </div>
  )

  const nome = p.nome ?? 'Personagem'
  const np   = sessao?.nivel_poder ?? '?'

  // Props compartilhadas
  const propsMach = { machucados, pct, statusAtual, jogsPodemAlterar, alterarMachucados }
  const propsDados = {
    personagem: p, rolarNotacao, notacaoMod,
    resistenciaTotal, rolls, diceInput, setDiceInput,
    handleDiceInput, submitDice, historicRef, inputRef, dadoIcon
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const corPrimaria   = p.cor_primaria   || '#8b0000'
  const corSecundaria = p.cor_secundaria || '#cccccc'

  return (
    <div
      className={`ficha-root ${p.tema_blocos === 'claro' ? 'ficha-tema-claro' : 'ficha-tema-escuro'}`}
      style={{
        '--cor-primaria': corPrimaria,
        '--cor-secundaria': corSecundaria,
        '--cor-primaria-07': hexParaRgba(corPrimaria, 0.07),
        '--cor-primaria-13': hexParaRgba(corPrimaria, 0.13),
        '--cor-primaria-20': hexParaRgba(corPrimaria, 0.2),
        '--cor-primaria-40': hexParaRgba(corPrimaria, 0.4),
      }}
    >

      {/* IMAGEM DE FUNDO — ocupa toda a tela */}
      <div
        className={`ficha-bg ${ajustando ? 'ficha-bg-ajustando' : ''}`}
        onMouseDown={iniciarAjuste}
        onTouchStart={iniciarAjuste}
        ref={dragRef}
      >
        {p.foto
          ? <img
              src={p.foto}
              className="ficha-bg-img"
              alt=""
              style={{
                objectPosition: `${imgPos.x}% ${imgPos.y}%`,
                transform: `scale(${imgPos.zoom})`,
                transformOrigin: `${imgPos.x}% ${imgPos.y}%`,
              }}
            />
          : <div className="ficha-bg-vazia" />
        }
        <div className="ficha-bg-overlay" />
      </div>

      {/* TOPO */}
      <header className="ficha-topo">
        <div className="ficha-topo-esq">
          <button className="ficha-btn-ghost" onClick={() => navigate('/dashboard')}>← Dashboard</button>
        </div>
        <div className="ficha-topo-centro">
          <h1 className="ficha-nome">{nome.toUpperCase()}</h1>
          <span className="ficha-sessao-label">
            {[
              p.nome_civil && `Nome: ${p.nome_civil}`,
              p.cidade && `Cidade: ${p.cidade}`,
              p.equipe && `Equipe: ${p.equipe}`,
            ].filter(Boolean).join(' · ') || (sessao?.nome ?? '')}
          </span>
        </div>
        <div className="ficha-topo-dir" style={{ position: 'relative' }}>
          <span className="ficha-np-badge">NP {np}</span>

          {(personagemIdParam || (ehMeuChar && (jogsPodeEditar || jogsPodePersonalizar))) && (
            <button
              className={`ficha-btn-ghost ${painelAberto ? 'ficha-btn-ativo' : ''}`}
              onClick={() => setPainelAberto(a => !a)}
              title="Editar e personalizar ficha"
            >
              ⚙
            </button>
          )}

          {painelAberto && (
            <div className="ficha-gear-dropdown">
              {(personagemIdParam || (ehMeuChar && jogsPodeEditar)) && (
                <button className="ficha-gear-item"
                  onClick={() => { window.open(`/sessao/${id}/editar-personagem/${p.id}`, '_blank'); setPainelAberto(false) }}>
                  ✏️ Editar ficha completa
                </button>
              )}

              {(personagemIdParam || (ehMeuChar && jogsPodePersonalizar)) && (
                <>
                  <div className="ficha-gear-divisor" />
                  <div className="ficha-gear-titulo">🎨 Personalizar aparência</div>

                  <div className="ficha-gear-cores">
                    <label>
                      <span>Cor primária</span>
                      <input type="color" value={p.cor_primaria || '#8b0000'}
                        onChange={e => mudarAparenciaLocal('cor_primaria', e.target.value)} />
                    </label>
                    <label>
                      <span>Cor secundária</span>
                      <input type="color" value={p.cor_secundaria || '#cccccc'}
                        onChange={e => mudarAparenciaLocal('cor_secundaria', e.target.value)} />
                    </label>
                  </div>

                  <div className="ficha-gear-tema">
                    <button
                      className={`ficha-btn-ghost ${(p.tema_blocos ?? 'escuro') === 'escuro' ? 'ficha-btn-ativo' : ''}`}
                      onClick={() => mudarAparenciaLocal('tema_blocos', 'escuro')}>🌙 Escuro</button>
                    <button
                      className={`ficha-btn-ghost ${p.tema_blocos === 'claro' ? 'ficha-btn-ativo' : ''}`}
                      onClick={() => mudarAparenciaLocal('tema_blocos', 'claro')}>☀️ Claro</button>
                  </div>

                  <button className="ficha-gear-salvar" onClick={salvarAparencia} disabled={salvandoAparencia}>
                    {salvandoAparencia ? 'Salvando...' : '💾 Salvar aparência'}
                  </button>
                </>
              )}
            </div>
          )}

          {ehMeuChar && (
            <>
              <button
                className={`ficha-btn-ghost ${ajustando ? 'ficha-btn-ativo' : ''}`}
                onClick={() => { setAjustando(a => !a) }}
                title="Reposicionar imagem de fundo"
              >
                {ajustando ? '✓ Salvar posição' : '🖼 Ajustar imagem'}
              </button>
              {ajustando && (
                <div className="ficha-zoom-ctrl">
                  <button onClick={() => ajustarZoom(-0.1)}>−</button>
                  <span>{Math.round(imgPos.zoom * 100)}%</span>
                  <button onClick={() => ajustarZoom(+0.1)}>+</button>
                </div>
              )}
              {ajustando && (
                <label className="ficha-btn-ghost" title="Trocar foto">
                  {uploadandoFoto ? '⏳' : '📷 Foto'}
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={handleFotoUpload} disabled={uploadandoFoto} />
                </label>
              )}
            </>
          )}
        </div>
      </header>

      {/* ════════════════════════════
          DESKTOP — 3 colunas
          ════════════════════════════ */}
      <div className="ficha-container">

        {/* COLUNA 1 — atributos + info da ficha */}
        <div className="ficha-coluna" id="ficha-col1">
          <div className="grid-atributos">
            {ATRIBUTOS.map(({ sigla, chave }) => (
              <div key={chave} className="caixa-atributo">
                <div className="atr-titulo">{sigla}</div>
                <div className="atr-valor">{p[chave] ?? 0}</div>
              </div>
            ))}
          </div>

          {/* Poderes — texto livre */}
          <SecaoTexto titulo="PODERES" texto={p.poderes_texto} />

          {/* Perícias por extenso, como escrito na criação — além da lista de rolagem na coluna ao lado */}
          <SecaoTexto titulo="PERÍCIAS" texto={p.pericias_texto} />

          {/* Vantagens — texto livre */}
          <SecaoTexto titulo="VANTAGENS" texto={p.vantagens_texto} />

          {/* Equipamentos — texto livre */}
          <SecaoTexto titulo="EQUIPAMENTOS" texto={p.equipamentos_texto} />

          {/* Ofensivo */}
          <SecaoOfensivo personagem={p} dadoIcon={dadoIcon} rolarNotacao={rolarNotacao} notacaoMod={notacaoMod} />

          {/* Defensivo */}
          <SecaoDefensivo personagem={p} resistenciaTotal={resistenciaTotal} dadoIcon={dadoIcon} rolarNotacao={rolarNotacao} notacaoMod={notacaoMod} />

          {/* Complicações — texto livre */}
          <SecaoTexto titulo="COMPLICAÇÕES" texto={p.complicacoes_texto} />

          {/* Citação */}
          {p.citacao?.trim() && <div className="ficha-citacao">"{p.citacao}"</div>}
        </div>

        {/* COLUNA 2 — perícias (rolagem), machucados e dados */}
        <div className="ficha-coluna" id="ficha-col2">
          <SecaoPericias personagem={p} rolarPericia={rolarPericia} dadoIcon={dadoIcon} />
          <SecaoMachucados {...propsMach} />
          <BlocoDados {...propsDados} />
        </div>

        {/* COLUNA 3 — deixada vazia de propósito: é o espaço onde a imagem
            de fundo aparece sem nenhum bloco por cima */}

      </div>

      {/* ════════════════════════════
          MOBILE — abas
          ════════════════════════════ */}
      <div className="mobile-content">

        {abaMobile === 'combate' && (
          <div className="mobile-aba-content">
            <SecaoMachucados {...propsMach} />
            <div className="grid-atributos" style={{ marginBottom: 8 }}>
              {ATRIBUTOS.map(({ sigla, chave }) => (
                <div key={chave} className="caixa-atributo">
                  <div className="atr-titulo">{sigla}</div>
                  <div className="atr-valor">{p[chave] ?? 0}</div>
                </div>
              ))}
            </div>
            <SecaoOfensivo personagem={p} dadoIcon={dadoIcon} rolarNotacao={rolarNotacao} notacaoMod={notacaoMod} />
            <SecaoDefensivo personagem={p} resistenciaTotal={resistenciaTotal} dadoIcon={dadoIcon} rolarNotacao={rolarNotacao} notacaoMod={notacaoMod} />
          </div>
        )}

        {abaMobile === 'dados' && (
          <div className="mobile-aba-content mobile-dados-wrapper">
            <BlocoDados {...propsDados} mobile />
          </div>
        )}

        {abaMobile === 'pericias' && (
          <div className="mobile-aba-content">
            <SecaoPericias personagem={p} rolarPericia={rolarPericia} dadoIcon={dadoIcon} />
          </div>
        )}

        {abaMobile === 'ficha' && (
          <div className="mobile-aba-content">
            <div className="mobile-ficha-header">
              <div className="mobile-ficha-nome">{nome}</div>
              <div className="mobile-ficha-meta">
                {[
                  p.nome_civil && `Nome: ${p.nome_civil}`,
                  p.cidade && `Cidade: ${p.cidade}`,
                  p.equipe && `Equipe: ${p.equipe}`,
                ].filter(Boolean).join(' · ') || `${sessao?.nome ?? ''} · NP ${np}`}
              </div>
            </div>
            <SecaoTexto titulo="PODERES"       texto={p.poderes_texto} />
            <SecaoTexto titulo="PERÍCIAS"      texto={p.pericias_texto} />
            <SecaoTexto titulo="VANTAGENS"     texto={p.vantagens_texto} />
            <SecaoTexto titulo="EQUIPAMENTOS"  texto={p.equipamentos_texto} />
            <SecaoTexto titulo="COMPLICAÇÕES"  texto={p.complicacoes_texto} />
            {p.citacao && <div className="ficha-citacao">"{p.citacao}"</div>}
          </div>
        )}

      </div>

      {/* BOTTOM TAB BAR */}
      <nav className="mobile-tab-bar">
        {[
          { id: 'combate',  icone: '⚔',  label: 'Combate'  },
          { id: 'dados',    icone: '🎲',  label: 'Dados'    },
          { id: 'pericias', icone: '📋',  label: 'Perícias' },
          { id: 'ficha',    icone: '🦸',  label: 'Ficha'    },
        ].map(tab => (
          <button key={tab.id}
            className={`mobile-tab ${abaMobile === tab.id ? 'ativa' : ''}`}
            onClick={() => setAbaMobile(tab.id)}>
            <span className="mobile-tab-icone">{tab.icone}</span>
            <span className="mobile-tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

    </div>
  )
}

// ─── Seção de texto livre ─────────────────────────────────────────────────────

function SecaoTexto({ titulo, texto }) {
  if (!texto?.trim()) return null

  function renderLinha(linha, i) {
    // Suporte a **negrito**
    const partes = linha.split(/\*\*([^*]+)\*\*/)
    return (
      <p key={i} style={{ margin: '2px 0', paddingLeft: linha.startsWith('  ') ? 12 : 0 }}>
        {partes.map((parte, j) =>
          j % 2 === 1 ? <strong key={j}>{parte}</strong> : parte
        )}
      </p>
    )
  }

  return (
    <div className="secao">
      <div className="secao-titulo">{titulo}</div>
      <div className="secao-conteudo">
        {texto.split('\n').filter(Boolean).map(renderLinha)}
      </div>
    </div>
  )
}

// ─── Ofensivo ─────────────────────────────────────────────────────────────────

function SecaoOfensivo({ personagem: p, dadoIcon, rolarNotacao, notacaoMod }) {
  const iniciativa = p.consciencia ?? 0
  const luta       = p.luta ?? 0

  return (
    <div className="secao">
      <div className="secao-titulo">OFENSIVO</div>
      <div className="secao-conteudo">
        <div className="ofensivo-iniciativa"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          title="Clique para rolar Iniciativa"
          onClick={() => rolarNotacao('Iniciativa', notacaoMod(iniciativa))}>
          <img src={dadoIcon} alt="d20" style={{ width: 14, filter: 'invert(1)', opacity: 0.7 }} />
          INICIATIVA +{iniciativa}
        </div>
        <div style={{ marginTop: 8 }}>
          <div className="ofensivo-poder-bloco"
            style={{ cursor: 'pointer' }}
            title="Clique para rolar Ataque Corpo a Corpo"
            onClick={() => rolarNotacao('Ataque Corpo a Corpo', notacaoMod(luta))}>
            <div className="ofensivo-poder-nome">Ataque Corpo a Corpo</div>
            <div className="ofensivo-poder-linha">
              <img src={dadoIcon} alt="d20" style={{ width: 13, filter: 'invert(1)', opacity: 0.7 }} />
              <span>1d20 + {luta} (LUT)</span>
            </div>
          </div>
          <p style={{ color: '#555', fontSize: '0.78rem', marginTop: 6, fontStyle: 'italic' }}>
            Os ataques e CDs estão descritos nos poderes acima.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Defensivo ────────────────────────────────────────────────────────────────

function SecaoDefensivo({ personagem: p, resistenciaTotal, dadoIcon, rolarNotacao, notacaoMod }) {
  const defesas = [
    { label: 'ESQUIVA',    valor: p.esquiva   ?? 0, passiva: true  },
    { label: 'APARAR',     valor: p.aparar    ?? 0, passiva: true  },
    { label: 'FORTITUDE',  valor: p.fortitude ?? 0, passiva: false,
      fn: () => rolarNotacao('Fortitude',   notacaoMod(p.fortitude ?? 0)) },
    { label: 'RESISTÊNCIA', valor: resistenciaTotal, passiva: false,
      fn: () => rolarNotacao('Resistência', notacaoMod(resistenciaTotal)) },
    { label: 'VONTADE',    valor: p.vontade   ?? 0, passiva: false,
      fn: () => rolarNotacao('Vontade',     notacaoMod(p.vontade ?? 0)) },
  ]

  return (
    <div className="secao">
      <div className="secao-titulo">DEFENSIVO</div>
      <div className="secao-conteudo">
        <div className="def-grupo-label">Defesas passivas</div>
        {defesas.filter(d => d.passiva).map(({ label, valor }) => (
          <div key={label} className="defensivo-item">
            <span className="def-nome">{label}</span>
            <span className="def-valor def-passiva">{valor}</span>
          </div>
        ))}
        <div style={{ height: 1, backgroundColor: '#1e1e1e', margin: '8px 0' }} />
        <div className="def-grupo-label">Testes — clique para rolar</div>
        {defesas.filter(d => !d.passiva).map(({ label, valor, fn }) => (
          <div key={label} className="defensivo-item" style={{ cursor: 'pointer' }}
            onClick={fn} title={`Rolar ${label}`}>
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

// ─── Perícias ─────────────────────────────────────────────────────────────────

function SecaoPericias({ personagem, dadoIcon, rolarPericia }) {
  const p = personagem ?? {}

  const itensDigitados = separarItensPericias(p.pericias_texto)
    .map(parsearItemPericia)
    .filter(Boolean)

  const usados = new Set()
  const linhasFixas = PERICIAS_FIXAS.map(fx => {
    let indiceEncontrado = -1
    for (let i = 0; i < itensDigitados.length; i++) {
      if (usados.has(i)) continue
      if (encontrarPericiaFixa(itensDigitados[i].nome) === fx) { indiceEncontrado = i; break }
    }
    if (indiceEncontrado !== -1) {
      usados.add(indiceEncontrado)
      return { nome: fx.nome, bonus: itensDigitados[indiceEncontrado].bonus, treinada: true, usavel: true }
    }
    return { nome: fx.nome, bonus: p[fx.chave] ?? 0, treinada: false, usavel: !fx.soTreinado }
  })

  // Especialidades e qualquer outra perícia digitada que não bateu com a lista fixa
  const linhasExtras = itensDigitados
    .filter((_, i) => !usados.has(i))
    .map(item => ({ nome: item.nome, bonus: item.bonus, treinada: true, usavel: true }))

  const linhas = [...linhasFixas, ...linhasExtras]

  return (
    <div className="secao pericias-secao">
      <div className="secao-titulo" style={{ textAlign: 'center' }}>PERÍCIAS</div>
      <div className="pericias-header">
        <span className="ph-pericia">PERÍCIA</span>
        <span>BÔNUS</span>
      </div>
      <div className="pericias-lista">
        {linhas.map((linha, i) => (
          <div key={i}
            className={`pericia-linha ${linha.treinada ? 'pericia-treinada' : ''} ${!linha.usavel ? 'pericia-bloqueada' : ''}`}
            style={{ cursor: linha.usavel ? 'pointer' : 'default' }}
            onClick={() => linha.usavel && rolarPericia(linha.nome, linha.bonus)}
            title={linha.usavel
              ? `Rolar ${linha.nome}: 1d20 + ${linha.bonus}`
              : `${linha.nome} só pode ser testada por quem tem graduação nela`}>
            <img src={dadoIcon} className="per-dado-icon" alt="rolar" />
            <span className="per-nome">{linha.nome}</span>
            <span className="per-temp">{linha.usavel ? `+${linha.bonus}` : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Machucados ───────────────────────────────────────────────────────────────

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
          <p style={{ textAlign: 'center', color: '#555', fontSize: '0.78rem', margin: '4px 0', fontStyle: 'italic' }}>
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

// ─── Bloco de dados ───────────────────────────────────────────────────────────

function BlocoDados({ personagem: p, rolarNotacao, notacaoMod, resistenciaTotal, rolls, diceInput, setDiceInput, handleDiceInput, submitDice, historicRef, inputRef, dadoIcon, mobile }) {
  return (
    <>
      <div className="dados-rapidos-titulo">Rolagens Rápidas</div>
      <div className="dados-rapidos">
        <button className="dados-btn-rapido"
          onClick={() => rolarNotacao('Iniciativa', notacaoMod(p.consciencia ?? 0))}>
          ⚡ Iniciativa (+{p.consciencia ?? 0})
        </button>
        <button className="dados-btn-rapido"
          onClick={() => rolarNotacao('Resistência', notacaoMod(resistenciaTotal))}>
          🛡 Resistência (+{resistenciaTotal})
        </button>
        <button className="dados-btn-rapido"
          onClick={() => rolarNotacao('Vontade', notacaoMod(p.vontade ?? 0))}>
          🧠 Vontade (+{p.vontade ?? 0})
        </button>
        <button className="dados-btn-rapido"
          onClick={() => rolarNotacao('Fortitude', notacaoMod(p.fortitude ?? 0))}>
          💪 Fortitude (+{p.fortitude ?? 0})
        </button>
        <button className="dados-btn-rapido"
          onClick={() => rolarNotacao('Ataque', notacaoMod(p.luta ?? 0))}>
          ⚔ Ataque (+{p.luta ?? 0})
        </button>
      </div>
      <div className="dados-historico" ref={historicRef} style={mobile ? { minHeight: '40vh' } : {}}>
        {rolls.length === 0 && (
          <div className="dados-historico-vazio">Os resultados aparecem aqui</div>
        )}
        {rolls.map(r => <RollResult key={r.id} roll={r} />)}
      </div>
      <div className={mobile ? 'mobile-dados-input-sticky' : ''}>
        <div className="dados-input-bar">
          <input ref={inputRef} className="dados-input"
            placeholder="Ex: 1d20, 2d6+3, 1d20+5"
            value={diceInput}
            onChange={e => setDiceInput(e.target.value)}
            onKeyDown={handleDiceInput} />
          <button className="dados-input-btn" onClick={submitDice} title="Rolar (Enter)">
            <img src={dadoIcon} alt="rolar" style={{ width: 20, height: 20, filter: 'invert(1)' }} />
          </button>
        </div>
      </div>
    </>
  )
}

// ─── RollResult ───────────────────────────────────────────────────────────────

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