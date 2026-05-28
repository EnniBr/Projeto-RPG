import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSessao } from '../contexts/SessaoContext'
import api from '../services/api'
import regras from '../data/regras_mm3e.json'
import './CriacaoPersonagem.css'

const HABILIDADES = [
  { nome: 'Força',       chave: 'forca',       sigla: 'FOR', desc: 'Poder físico bruto' },
  { nome: 'Vigor',       chave: 'vigor',       sigla: 'VIG', desc: 'Saúde e resistência' },
  { nome: 'Agilidade',   chave: 'agilidade',   sigla: 'AGI', desc: 'Equilíbrio e coordenação' },
  { nome: 'Destreza',    chave: 'destreza',    sigla: 'DES', desc: 'Precisão e ataques à distância' },
  { nome: 'Luta',        chave: 'luta',        sigla: 'LUT', desc: 'Combate corpo a corpo' },
  { nome: 'Intelecto',   chave: 'intelecto',   sigla: 'INT', desc: 'Raciocínio e aprendizado' },
  { nome: 'Consciência', chave: 'consciencia', sigla: 'CON', desc: 'Intuição e percepção' },
  { nome: 'Presença',    chave: 'presenca',    sigla: 'PRE', desc: 'Carisma e força social' },
]

const DEFESAS_CONFIG = [
  { nome: 'Esquiva',   chave: 'esquiva',   base: 'agilidade',   desc: 'Evitar ataques à distância' },
  { nome: 'Aparar',    chave: 'aparar',    base: 'luta',        desc: 'Bloquear ataques corpo a corpo' },
  { nome: 'Fortitude', chave: 'fortitude', base: 'vigor',       desc: 'Resistir efeitos físicos' },
  { nome: 'Vontade',   chave: 'vontade',   base: 'consciencia', desc: 'Resistir efeitos mentais' },
]

const PERICIAS_LISTA  = regras.pericias
const TODAS_VANTAGENS = [
  ...regras.vantagens.categorias.combate.map(v => ({ ...v, categoria: 'Combate' })),
  ...regras.vantagens.categorias.fortuna.map(v => ({ ...v, categoria: 'Fortuna' })),
  ...regras.vantagens.categorias.geral.map(v =>   ({ ...v, categoria: 'Geral' })),
  ...regras.vantagens.categorias.pericia.map(v => ({ ...v, categoria: 'Perícia' })),
].sort((a, b) => a.nome.localeCompare(b.nome))

const EFEITOS_LISTA = regras.efeitos_de_poderes.efeitos
  .filter(e => e.custo_base !== null)
  .sort((a, b) => a.nome.localeCompare(b.nome))

const EXTRAS_LISTA = regras.modificadores.extras
const FALHAS_LISTA = regras.modificadores.falhas

const TITULO_MAX = 60
const DESC_MAX   = 280

function CriacaoPersonagem() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { setSessaoAtiva } = useSessao()

  const [sessao,      setSessao]      = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [salvando,    setSalvando]    = useState(false)
  const [erro,        setErro]        = useState('')

  const [nomeHeroi,    setNomeHeroi]    = useState('')
  const [origem,       setOrigem]       = useState('')
  const [habilidades,  setHabilidades]  = useState({ forca: 0, vigor: 0, agilidade: 0, destreza: 0, luta: 0, intelecto: 0, consciencia: 0, presenca: 0 })
  const [defesas,      setDefesas]      = useState({ esquiva: 0, aparar: 0, fortitude: 0, vontade: 0 })
  const [pericias,     setPericias]     = useState([])
  const [vantagens,    setVantagens]    = useState([])
  const [poderes,      setPoderes]      = useState([])
  const [complicacoes, setComplicacoes] = useState([])
  const [modalImportar, setModalImportar] = useState(false)
  const importRef = useRef(null)

useEffect(() => {
  async function init() {
    try {
      const [sessaoResp, checkResp] = await Promise.all([
        api.get(`/sessoes/${id}`),
        api.get(`/sessoes/${id}/meu-personagem`),
      ])
      if (checkResp.data.personagem) { navigate(`/sessao/${id}/ficha`, { replace: true }); return }
      setSessao(sessaoResp.data)
      setSessaoAtiva(sessaoResp.data)
    } catch (e) { console.error('Erro ao inicializar criação:', e) }
    finally { setVerificando(false) }
  }
  init()
}, [id])

  const np            = sessao?.nivel_poder ?? 10
  const ppTotal       = np * 15
  const ppHabilidades = Object.values(habilidades).reduce((s, v) => s + v * 2, 0)
  const ppDefesas     = Object.values(defesas).reduce((s, v) => s + v, 0)
  const ppPericias    = Math.ceil(pericias.reduce((s, p) => s + p.graduacoes, 0) / 2)
  const ppVantagens = vantagens.reduce((s, v) => s + (Number(v.graduacoes) || 1), 0)
  const ppPoderes     = poderes.reduce((s, p) => s + p.custo_total, 0)
  const ppGasto       = ppHabilidades + ppDefesas + ppPericias + ppVantagens + ppPoderes
  const ppRestante    = ppTotal - ppGasto

  function changeHabilidade(chave, delta) {
    setHabilidades(prev => ({ ...prev, [chave]: Math.max(0, Math.min(np, prev[chave] + delta)) }))
  }
  function changeDefesa(chave, delta) {
    setDefesas(prev => ({ ...prev, [chave]: Math.max(0, prev[chave] + delta) }))
  }
  function togglePericia(pericia) {
    const jaTem = pericias.find(p => p.nome_pericia === pericia.nome)
    if (jaTem) setPericias(prev => prev.filter(p => p.nome_pericia !== pericia.nome))
    else setPericias(prev => [...prev, { nome_pericia: pericia.nome, habilidade: pericia.habilidade_vinculada, graduacoes: 1 }])
  }
  function changePericiaGrad(nome, delta) {
    setPericias(prev => prev.map(p => p.nome_pericia === nome ? { ...p, graduacoes: Math.max(1, Math.min(np + 10, p.graduacoes + delta)) } : p))
  }
  function toggleVantagem(v) {
    const jaTem = vantagens.find(x => x.nome_vantagem === v.nome)
    if (jaTem) setVantagens(prev => prev.filter(x => x.nome_vantagem !== v.nome))
    else setVantagens(prev => [...prev, { nome_vantagem: v.nome, graduacoes: 1, graduada: v.graduada }])
  }
  function changeVantagemGrad(nome, delta) {
    setVantagens(prev => prev.map(v => v.nome_vantagem === nome ? { ...v, graduacoes: Math.max(1, v.graduacoes + delta) } : v))
  }

  function recalcPoder(p) {
    const custoPorGrad = Math.max(1, p.custo_base + p.extras.length - p.falhas.length)
    return { ...p, custo_total: custoPorGrad * p.graduacoes }
  }
  function addPoder() {
    setPoderes(prev => [...prev, { uid: Date.now(), nome: '', efeito_base: '', custo_base: 1, graduacoes: 1, extras: [], falhas: [], custo_total: 1 }])
  }
  function removePoder(uid) { setPoderes(prev => prev.filter(p => p.uid !== uid)) }
  function updatePoder(uid, field, value) {
    setPoderes(prev => prev.map(p => p.uid !== uid ? p : recalcPoder({ ...p, [field]: value })))
  }
  function setPoderEfeito(uid, efeitoNome) {
    const efeito = EFEITOS_LISTA.find(e => e.nome === efeitoNome)
    setPoderes(prev => prev.map(p => p.uid !== uid ? p : recalcPoder({ ...p, efeito_base: efeitoNome, custo_base: efeito?.custo_base ?? 1 })))
  }
  function togglePoderMod(uid, tipo, nome) {
    setPoderes(prev => prev.map(p => {
      if (p.uid !== uid) return p
      const lista = p[tipo]
      const novaLista = lista.includes(nome) ? lista.filter(x => x !== nome) : [...lista, nome]
      return recalcPoder({ ...p, [tipo]: novaLista })
    }))
  }

  function addComplicacao() {
    setComplicacoes(prev => [...prev, { uid: Date.now(), titulo: '', descricao: '' }])
  }
  function removeComplicacao(uid) { setComplicacoes(prev => prev.filter(c => c.uid !== uid)) }
  function updateComplicacao(uid, field, value) {
    setComplicacoes(prev => prev.map(c => c.uid !== uid ? c : { ...c, [field]: value }))
  }

  async function salvar() {
    if (!nomeHeroi.trim()) { setErro('O herói precisa de um nome!'); return }
    if (ppRestante < 0)    { setErro(`Você gastou ${Math.abs(ppRestante)} PP a mais. Revise as escolhas.`); return }
    setSalvando(true); setErro('')
    try {
      await api.post('/personagens/criar-completo', {
        sessao_id:    Number(id),
        nome:         nomeHeroi.trim(),
        atributos:    { ...habilidades, ...defesas },
        pericias:     pericias.map(p => ({ nome_pericia: p.nome_pericia, graduacoes: p.graduacoes })),
        vantagens:    vantagens.map(v => ({ nome_vantagem: v.nome_vantagem, graduacoes: v.graduacoes })),
        poderes:      poderes.map(p => ({ nome: p.nome || p.efeito_base || 'Poder', efeito_base: p.efeito_base, graduacoes: p.graduacoes, custo_total: p.custo_total, extras: p.extras, falhas: p.falhas, descritores: '' })),
        complicacoes: complicacoes.filter(c => c.titulo.trim()).map(c => ({ titulo: c.titulo.trim(), descricao: c.descricao.trim() })),
      })
      navigate(`/sessao/${id}/ficha`)
    } catch (e) {
      console.error(e)
      setErro('Erro ao salvar personagem. Verifique o console.')
    } finally { setSalvando(false) }
  }

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
      setNomeHeroi(dados.personagem?.nome ?? '')
      setHabilidades({
        forca: dados.atributos?.forca ?? 0, vigor: dados.atributos?.vigor ?? 0,
        agilidade: dados.atributos?.agilidade ?? 0, destreza: dados.atributos?.destreza ?? 0,
        luta: dados.atributos?.luta ?? 0, intelecto: dados.atributos?.intelecto ?? 0,
        consciencia: dados.atributos?.consciencia ?? 0, presenca: dados.atributos?.presenca ?? 0,
      })
      setDefesas({
        esquiva: dados.atributos?.esquiva ?? 0, aparar: dados.atributos?.aparar ?? 0,
        fortitude: dados.atributos?.fortitude ?? 0, vontade: dados.atributos?.vontade ?? 0,
      })
      setPericias(dados.pericias?.map(p => ({ nome_pericia: p.nome_pericia, graduacoes: p.graduacoes })) ?? [])
      console.log('Vantagens do PDF:', dados.vantagens)
      setVantagens(dados.vantagens?.map(v => ({
        nome_vantagem: v.nome_vantagem ?? v.nome ?? '',
        graduacoes:    v.graduacoes   ?? 1,
        graduada:      false
      })) ?? [])
      setPoderes(dados.poderes?.map(p => {
        const efeito = EFEITOS_LISTA.find(e => e.nome === p.efeito_base)
        const custoBase = efeito?.custo_base ?? 1
        const poder = {
          uid:         Date.now() + Math.random(),
          nome:        p.nome        ?? '',
          efeito_base: p.efeito_base ?? '',
          custo_base:  custoBase,
          graduacoes:  p.graduacoes  ?? 1,
          extras:      Array.isArray(p.extras) ? p.extras : [],
          falhas:      Array.isArray(p.falhas) ? p.falhas : [],
          custo_total: 1,
        }
        return recalcPoder(poder)
      }) ?? [])
      setComplicacoes(dados.complicacoes?.map(c => ({ titulo: c.titulo ?? '', descricao: c.descricao ?? '' })) ?? [])
    } catch (err) {
      alert('Erro ao ler ficha: ' + err.message)
    }
  }

  if (verificando) return <div className="cria-loading"><div className="cria-loading-texto">Carregando sessão...</div></div>

  return (
    <div className="cria-wrapper">

      <header className="cria-pp-header">
        <div className="cria-pp-sessao">
          <span className="cria-pp-sessao-nome">{sessao?.nome ?? `Sessão ${id}`}</span>
          <span className="cria-pp-np">NP {np}</span>
          <button
            onClick={() => importRef.current?.click()}
            style={{ padding: '6px 14px', backgroundColor: '#111', border: '1px solid #333', borderRadius: 6, color: '#aaa', fontSize: '0.82rem', cursor: 'pointer' }}
          >
            ⬆ Importar PDF
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={importarDoPDF}
          />
        </div>
        <div className="cria-pp-barra-wrapper">
          <div className="cria-pp-barra-bg">
            <div className="cria-pp-barra-fill" style={{
              width: `${Math.min(100, (ppGasto / ppTotal) * 100)}%`,
              backgroundColor: ppRestante < 0 ? '#c0392b' : ppRestante < ppTotal * 0.1 ? '#e67e22' : '#2ecc71',
            }} />
          </div>
          <div className="cria-pp-numeros">
            <span className={ppRestante < 0 ? 'cria-pp-negativo' : ''}>
              {ppRestante < 0 ? `${ppRestante} PP (acima do limite!)` : `${ppRestante} PP restantes`}
            </span>
            <span className="cria-pp-total-label">{ppGasto} / {ppTotal}</span>
          </div>
        </div>
        <div className="cria-pp-breakdown">
          {ppHabilidades > 0 && <span>Hab: {ppHabilidades}</span>}
          {ppDefesas     > 0 && <span>Def: {ppDefesas}</span>}
          {ppPericias    > 0 && <span>Per: {ppPericias}</span>}
          {ppVantagens   > 0 && <span>Van: {ppVantagens}</span>}
          {ppPoderes     > 0 && <span>Pod: {ppPoderes}</span>}
        </div>
      </header>

      <div className="cria-conteudo">

        {/* 01 — INFORMAÇÕES BÁSICAS */}
        <section className="cria-secao">
          <div className="cria-secao-titulo">
            <span className="cria-secao-numero">01</span>
            <h2>Informações Básicas</h2>
          </div>
          <div className="cria-secao-corpo">
            <div className="cria-campo-grupo">
              <div className="cria-campo">
                <label>Nome do Herói <span className="cria-campo-obrig">*</span></label>
                <input type="text" placeholder="Ex: Capitão Raio, Sombra, Titã..."
                  value={nomeHeroi} onChange={e => setNomeHeroi(e.target.value)} className="cria-input" />
                <span className="cria-campo-dica">Nome exibido na ficha durante o jogo.</span>
              </div>
              <div className="cria-campo">
                <label>Origem / Conceito</label>
                <input type="text" placeholder="Ex: Cientista acidentado, Alienígena exilado..."
                  value={origem} onChange={e => setOrigem(e.target.value)} className="cria-input" />
                <span className="cria-campo-dica">Campo opcional, para sua referência.</span>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — HABILIDADES */}
        <section className="cria-secao">
          <div className="cria-secao-titulo">
            <span className="cria-secao-numero">02</span>
            <h2>Habilidades</h2>
            <span className="cria-secao-custo-tag">2 PP / graduação · Máximo: NP {np}</span>
          </div>
          <div className="cria-secao-corpo">
            <div className="cria-habilidades-grid">
              {HABILIDADES.map(({ nome: n, chave, sigla, desc }) => (
                <div key={chave} className="cria-hab-card">
                  <div className="cria-hab-sigla">{sigla}</div>
                  <div className="cria-hab-nome">{n}</div>
                  <div className="cria-hab-desc">{desc}</div>
                  <div className="cria-hab-controles">
                    <button className="cria-btn-ctrl" onClick={() => changeHabilidade(chave, -1)} disabled={habilidades[chave] === 0}>−</button>
                    <span className="cria-hab-valor">{habilidades[chave]}</span>
                    <button className="cria-btn-ctrl" onClick={() => changeHabilidade(chave, 1)} disabled={habilidades[chave] >= np || ppRestante < 2}>+</button>
                  </div>
                  <div className="cria-hab-pp">{habilidades[chave] * 2} PP</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 03 — DEFESAS */}
        <section className="cria-secao">
          <div className="cria-secao-titulo">
            <span className="cria-secao-numero">03</span>
            <h2>Defesas</h2>
            <span className="cria-secao-custo-tag">1 PP / graduação extra</span>
          </div>
          <div className="cria-secao-corpo">
            <p className="cria-secao-info">
              Cada defesa tem um valor base gratuito vindo das suas habilidades.
              Aqui você compra graduações <strong>adicionais</strong> com PP.
            </p>
            <div className="cria-defesas-grid">
              {DEFESAS_CONFIG.map(({ nome: n, chave, base, desc }) => {
                const valorBase     = habilidades[base]
                const valorComprado = defesas[chave]
                return (
                  <div key={chave} className="cria-def-card">
                    <div className="cria-def-nome">{n}</div>
                    <div className="cria-def-desc">{desc}</div>
                    <div className="cria-def-base">Base ({base}): <strong>+{valorBase}</strong></div>
                    <div className="cria-def-controles">
                      <button className="cria-btn-ctrl" onClick={() => changeDefesa(chave, -1)} disabled={valorComprado === 0}>−</button>
                      <span className="cria-def-comprado">+{valorComprado} <small>PP</small></span>
                      <button className="cria-btn-ctrl" onClick={() => changeDefesa(chave, 1)} disabled={ppRestante < 1}>+</button>
                    </div>
                    <div className="cria-def-total">Total: <strong>{valorBase + valorComprado}</strong></div>
                  </div>
                )
              })}
              <div className="cria-def-card cria-def-card-info">
                <div className="cria-def-nome">Resistência</div>
                <div className="cria-def-desc">Suportar dano físico</div>
                <div className="cria-def-base">Base (vigor): <strong>+{habilidades.vigor}</strong></div>
                <div className="cria-def-nota">Aumentada via poder de <em>Proteção</em></div>
              </div>
            </div>
          </div>
        </section>

        {/* 04 — PERÍCIAS */}
        <section className="cria-secao">
          <div className="cria-secao-titulo">
            <span className="cria-secao-numero">04</span>
            <h2>Perícias</h2>
            <span className="cria-secao-custo-tag">1 PP a cada 2 graduações</span>
          </div>
          <div className="cria-secao-corpo">
            {pericias.length > 0 && (
              <div className="cria-escolhidos">
                <div className="cria-escolhidos-titulo">Treinadas ({pericias.length})</div>
                {pericias.map(p => (
                  <div key={p.nome_pericia} className="cria-escolhido-linha">
                    <span className="cria-esq-nome">{p.nome_pericia}</span>
                    <span className="cria-esq-hab">{p.habilidade}</span>
                    <div className="cria-esq-controles">
                      <button onClick={() => changePericiaGrad(p.nome_pericia, -1)}>−</button>
                      <span>{p.graduacoes}</span>
                      <button onClick={() => changePericiaGrad(p.nome_pericia, 1)} disabled={ppRestante < 0.5}>+</button>
                    </div>
                    <button className="cria-esq-remover" onClick={() => togglePericia({ nome: p.nome_pericia })}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="cria-lista-opcoes">
              {PERICIAS_LISTA.map(p => {
                const ativa = pericias.find(x => x.nome_pericia === p.nome)
                return (
                  <div key={p.nome} className={`cria-opcao ${ativa ? 'cria-opcao-ativa' : ''}`}
                    onClick={() => togglePericia(p)} title={p.descricao}>
                    <span className="cria-opcao-nome">{p.nome}</span>
                    <span className="cria-opcao-hab">{p.habilidade_vinculada}</span>
                    <span className="cria-opcao-badge">{ativa ? '✓' : '+'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 05 — VANTAGENS */}
        <section className="cria-secao">
          <div className="cria-secao-titulo">
            <span className="cria-secao-numero">05</span>
            <h2>Vantagens</h2>
            <span className="cria-secao-custo-tag">1 PP por vantagem ou graduação</span>
          </div>
          <div className="cria-secao-corpo">
            {vantagens.length > 0 && (
              <div className="cria-escolhidos">
                <div className="cria-escolhidos-titulo">Adicionadas ({vantagens.length})</div>
                {vantagens.map(v => (
                  <div key={v.nome_vantagem} className="cria-escolhido-linha">
                    <span className="cria-esq-nome">{v.nome_vantagem}</span>
                    {v.graduada && (
                      <div className="cria-esq-controles">
                        <button onClick={() => changeVantagemGrad(v.nome_vantagem, -1)}>−</button>
                        <span>{v.graduacoes}</span>
                        <button onClick={() => changeVantagemGrad(v.nome_vantagem, 1)} disabled={ppRestante < 1}>+</button>
                      </div>
                    )}
                    <button className="cria-esq-remover" onClick={() => toggleVantagem({ nome: v.nome_vantagem })}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="cria-lista-opcoes">
              {TODAS_VANTAGENS.map(v => {
                const ativa = vantagens.find(x => x.nome_vantagem === v.nome)
                return (
                  <div key={v.nome} className={`cria-opcao ${ativa ? 'cria-opcao-ativa' : ''}`}
                    onClick={() => toggleVantagem(v)} title={v.descricao}>
                    <span className="cria-opcao-nome">{v.nome}</span>
                    <span className="cria-opcao-hab">{v.categoria}</span>
                    <span className="cria-opcao-badge">{ativa ? '✓' : '+'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 06 — PODERES */}
        <section className="cria-secao">
          <div className="cria-secao-titulo">
            <span className="cria-secao-numero">06</span>
            <h2>Poderes</h2>
            <span className="cria-secao-custo-tag">(custo base + extras − falhas) × graduações</span>
          </div>
          <div className="cria-secao-corpo">
            {poderes.length === 0 && (
              <p className="cria-secao-info">
                Clique em <strong>Adicionar Poder</strong> para criar os poderes do seu herói.
                Cada poder é construído escolhendo um efeito base e ajustando com extras e falhas.
              </p>
            )}
            {poderes.map(poder => (
              <PainelPoder key={poder.uid} poder={poder} np={np} ppRestante={ppRestante}
                onRemove={() => removePoder(poder.uid)}
                onUpdate={(f, v) => updatePoder(poder.uid, f, v)}
                onSetEfeito={nome => setPoderEfeito(poder.uid, nome)}
                onToggleMod={(tipo, nome) => togglePoderMod(poder.uid, tipo, nome)}
              />
            ))}
            <button className="cria-btn-adicionar-poder" onClick={addPoder}>+ Adicionar Poder</button>
          </div>
        </section>

        {/* 07 — COMPLICAÇÕES */}
        <section className="cria-secao">
          <div className="cria-secao-titulo">
            <span className="cria-secao-numero">07</span>
            <h2>Complicações</h2>
          </div>
          <div className="cria-secao-corpo">
            <p className="cria-secao-info">
              Complicações são aspectos do herói que criam drama: inimigos, segredos, responsabilidades,
              fraquezas. <strong>Não custam PP</strong> — o Mestre recompensa com Pontos de Herói quando
              elas entram em jogo.
            </p>

            {complicacoes.map(c => (
              <div key={c.uid} className="comp-card">
                <div className="comp-card-header">
                  <div className="cria-campo" style={{ flex: 1 }}>
                    <label>
                      Título
                      <span className="comp-contador">{c.titulo.length}/{TITULO_MAX}</span>
                    </label>
                    <input type="text"
                      placeholder="Ex: Identidade Secreta, Inimigo Mortal, Código de Honra..."
                      value={c.titulo} maxLength={TITULO_MAX}
                      onChange={e => updateComplicacao(c.uid, 'titulo', e.target.value)}
                      className="cria-input" />
                  </div>
                  <button className="cria-esq-remover comp-remover" onClick={() => removeComplicacao(c.uid)}>✕</button>
                </div>
                <div className="cria-campo">
                  <label>
                    Descrição
                    <span className="comp-contador">{c.descricao.length}/{DESC_MAX}</span>
                  </label>
                  <textarea
                    placeholder="Descreva como essa complicação afeta o personagem e quais situações ela cria..."
                    value={c.descricao} maxLength={DESC_MAX} rows={3}
                    onChange={e => updateComplicacao(c.uid, 'descricao', e.target.value)}
                    className="cria-textarea" />
                </div>
              </div>
            ))}

            <button className="cria-btn-adicionar-poder" onClick={addComplicacao}>
              + Adicionar Complicação
            </button>
          </div>
        </section>

        {/* RODAPÉ */}
        <div className="cria-rodape">
          {erro && <p className="cria-erro">{erro}</p>}
          {!nomeHeroi.trim() && (
            <p className="cria-aviso">⚠ Preencha o nome do herói na Seção 01 para finalizar.</p>
          )}
          {ppRestante < 0 && (
            <p className="cria-aviso">⚠ Você gastou {Math.abs(ppRestante)} PP a mais. Revise suas escolhas.</p>
          )}
          <div className="cria-rodape-resumo">
            <span>Total gasto: <strong>{ppGasto} PP</strong></span>
            <span className={ppRestante < 0 ? 'cria-pp-negativo' : 'cria-pp-ok'}>
              Restante: <strong>{ppRestante} PP</strong>
            </span>
          </div>
          <button className="cria-btn-salvar" onClick={salvar}
            disabled={salvando || !nomeHeroi.trim() || ppRestante < 0}>
            {salvando ? 'Salvando...' : '✔ Finalizar Personagem e Entrar na Sessão'}
          </button>
        </div>

      </div>
    </div>
  )
}

function PainelPoder({ poder, np, ppRestante, onRemove, onUpdate, onSetEfeito, onToggleMod }) {
  const [expandido, setExpandido] = useState(true)
  const [abaAtiva,  setAbaAtiva]  = useState(null)
  const efeitoSelecionado = EFEITOS_LISTA.find(e => e.nome === poder.efeito_base)

  return (
    <div className="poder-painel">
      <div className="poder-header" onClick={() => setExpandido(e => !e)}>
        <div className="poder-header-info">
          <span className="poder-header-nome">{poder.nome || '(novo poder)'}</span>
          <span className="poder-header-efeito">{poder.efeito_base || 'efeito não definido'}</span>
        </div>
        <div className="poder-header-direita">
          <span className="poder-custo-badge">{poder.custo_total} PP</span>
          <span className="poder-expandir">{expandido ? '▲' : '▼'}</span>
          <button className="cria-esq-remover" onClick={e => { e.stopPropagation(); onRemove() }}>✕</button>
        </div>
      </div>
      {expandido && (
        <div className="poder-corpo">
          <div className="poder-linha-dupla">
            <div className="cria-campo">
              <label>Nome do Poder</label>
              <input type="text" placeholder="Ex: Raio Solar, Campo de Força..."
                value={poder.nome} onChange={e => onUpdate('nome', e.target.value)} className="cria-input" />
            </div>
            <div className="cria-campo">
              <label>Efeito Base</label>
              <select value={poder.efeito_base} onChange={e => onSetEfeito(e.target.value)} className="cria-select">
                <option value="">— Escolher efeito —</option>
                {EFEITOS_LISTA.map(e => <option key={e.nome} value={e.nome}>{e.nome} ({e.custo_base} PP/grad)</option>)}
              </select>
            </div>
          </div>
          {efeitoSelecionado && (
            <div className="poder-efeito-desc">
              <strong>{efeitoSelecionado.tipo}</strong> — {efeitoSelecionado.descricao}
            </div>
          )}
          <div className="poder-linha-tripla">
            <div className="cria-campo">
              <label>Custo Base (PP/grad)</label>
              <input type="number" min="1" value={poder.custo_base}
                onChange={e => onUpdate('custo_base', Math.max(1, Number(e.target.value)))}
                className="cria-input cria-input-numero" />
              <span className="cria-campo-dica">Editável para efeitos variáveis</span>
            </div>
            <div className="cria-campo">
              <label>Graduações</label>
              <input type="number" min="1" max={np} value={poder.graduacoes}
                onChange={e => onUpdate('graduacoes', Math.max(1, Math.min(np, Number(e.target.value))))}
                className="cria-input cria-input-numero" />
            </div>
            <div className="cria-campo">
              <label>Custo Total</label>
              <div className="poder-custo-total-display">
                {poder.custo_total} PP
                <small>({Math.max(1, poder.custo_base + poder.extras.length - poder.falhas.length)}/grad × {poder.graduacoes})</small>
              </div>
            </div>
          </div>
          <div className="poder-abas-ctrl">
            <button className={`poder-aba-btn ${abaAtiva === 'extras' ? 'poder-aba-ativa' : ''}`}
              onClick={() => setAbaAtiva(abaAtiva === 'extras' ? null : 'extras')}>
              ➕ Extras ({poder.extras.length})
            </button>
            <button className={`poder-aba-btn poder-aba-btn-falha ${abaAtiva === 'falhas' ? 'poder-aba-ativa' : ''}`}
              onClick={() => setAbaAtiva(abaAtiva === 'falhas' ? null : 'falhas')}>
              ➖ Falhas ({poder.falhas.length})
            </button>
            {(poder.extras.length > 0 || poder.falhas.length > 0) && (
              <span className="poder-mod-resumo">
                {poder.extras.length > 0 && <span className="poder-mod-extra">+{poder.extras.length} extras</span>}
                {poder.falhas.length > 0 && <span className="poder-mod-falha">−{poder.falhas.length} falhas</span>}
              </span>
            )}
          </div>
          {abaAtiva === 'extras' && (
            <div className="poder-mod-lista">
              <p className="poder-mod-explicacao">Cada extra adiciona <strong>+1 PP/graduação</strong>.</p>
              {EXTRAS_LISTA.map(e => (
                <div key={e.nome} className={`poder-mod-item ${poder.extras.includes(e.nome) ? 'poder-mod-ativo' : ''}`}
                  onClick={() => onToggleMod('extras', e.nome)} title={e.descricao}>
                  <span>{e.nome}</span><span className="poder-mod-badge">+1/grad</span>
                  <span>{poder.extras.includes(e.nome) ? '✓' : '+'}</span>
                </div>
              ))}
            </div>
          )}
          {abaAtiva === 'falhas' && (
            <div className="poder-mod-lista">
              <p className="poder-mod-explicacao">Cada falha subtrai <strong>−1 PP/graduação</strong> (mínimo 1).</p>
              {FALHAS_LISTA.map(f => (
                <div key={f.nome} className={`poder-mod-item poder-mod-item-falha ${poder.falhas.includes(f.nome) ? 'poder-mod-ativo' : ''}`}
                  onClick={() => onToggleMod('falhas', f.nome)} title={f.descricao}>
                  <span>{f.nome}</span><span className="poder-mod-badge poder-mod-badge-falha">−1/grad</span>
                  <span>{poder.falhas.includes(f.nome) ? '✓' : '+'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CriacaoPersonagem