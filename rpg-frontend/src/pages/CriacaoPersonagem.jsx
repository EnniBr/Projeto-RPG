import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSessao } from '../contexts/SessaoContext'
import api from '../services/api'
import './CriacaoPersonagem.css'
import FichaPreviewMini from '../components/FichaPreviewMini'

// ─── Config dos campos (labels + dicas) ────────────────────────────────────

const HABILIDADES_CAMPOS = [
  { chave: 'forca',       sigla: 'FOR', nome: 'Força',       desc: 'Poder físico bruto' },
  { chave: 'agilidade',   sigla: 'AGI', nome: 'Agilidade',   desc: 'Equilíbrio e coordenação' },
  { chave: 'luta',        sigla: 'LUT', nome: 'Luta',        desc: 'Combate corpo a corpo' },
  { chave: 'destreza',    sigla: 'DES', nome: 'Destreza',    desc: 'Precisão e ataques à distância' },
  { chave: 'vigor',       sigla: 'VIG', nome: 'Vigor',       desc: 'Saúde e resistência' },
  { chave: 'intelecto',   sigla: 'INT', nome: 'Intelecto',   desc: 'Raciocínio e aprendizado' },
  { chave: 'consciencia', sigla: 'CON', nome: 'Consciência', desc: 'Intuição, percepção e Iniciativa' },
  { chave: 'presenca',    sigla: 'PRE', nome: 'Presença',    desc: 'Carisma e força social' },
]

const DEFESAS_CAMPOS = [
  { chave: 'esquiva',     nome: 'Esquiva',     desc: 'Evitar ataques à distância (valor final, já com poderes)' },
  { chave: 'aparar',      nome: 'Aparar',      desc: 'Bloquear ataques corpo a corpo (valor final)' },
  { chave: 'fortitude',   nome: 'Fortitude',   desc: 'Resistir efeitos físicos (valor final)' },
  { chave: 'resistencia', nome: 'Resistência', desc: 'Só o bônus extra (de Proteção). O total exibido na ficha é Vigor + este valor.' },
  { chave: 'vontade',     nome: 'Vontade',     desc: 'Resistir efeitos mentais (valor final)' },
]

const DADOS_INICIAIS = {
  nome: '',
  forca: 0, agilidade: 0, luta: 0, destreza: 0, vigor: 0, intelecto: 0, consciencia: 0, presenca: 0,
  esquiva: 0, aparar: 0, fortitude: 0, resistencia: 0, vontade: 0,
  poderes_texto: '', pericias_texto: '', vantagens_texto: '', equipamentos_texto: '', complicacoes_texto: '',
  citacao: '',
}

function CriacaoPersonagem() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { setSessaoAtiva } = useSessao()

  const [sessao,      setSessao]      = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [salvando,    setSalvando]    = useState(false)
  const [erro,        setErro]        = useState('')

  const [dados, setDados] = useState(DADOS_INICIAIS)

  const [fotoFile,      setFotoFile]      = useState(null)
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState(null)

  const [abaMobile, setAbaMobile] = useState('editar') // 'editar' | 'preview'

  const fotoInputRef = useRef(null)

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

  useEffect(() => {
    // Libera a memória do object URL anterior ao trocar/desmontar
    return () => { if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl) }
  }, [fotoPreviewUrl])

  const np = sessao?.nivel_poder ?? 10

  function set(campo, valor) {
    setDados(prev => ({ ...prev, [campo]: valor }))
  }
  function setNum(campo, valor) {
    const n = valor === '' ? 0 : parseInt(valor, 10)
    setDados(prev => ({ ...prev, [campo]: Number.isNaN(n) ? 0 : n }))
  }

  function handleFotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl)
    setFotoFile(file)
    setFotoPreviewUrl(URL.createObjectURL(file))
  }
  function handleFotoRemover() {
    if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl)
    setFotoFile(null)
    setFotoPreviewUrl(null)
    if (fotoInputRef.current) fotoInputRef.current.value = ''
  }

  // ─── Salvar ────────────────────────────────────────────────────────────────

  async function salvar() {
    if (!dados.nome.trim()) { setErro('O herói precisa de um nome!'); return }
    setSalvando(true); setErro('')
    try {
      const resp = await api.post('/personagens/criar-completo', {
        sessao_id: Number(id),
        tipo: 'jogador',
        ...dados,
        nome: dados.nome.trim(),
      })

      const personagemCriado = resp.data
      if (fotoFile && personagemCriado?.id) {
        const form = new FormData()
        form.append('foto', fotoFile)
        try {
          await api.post(`/personagens/${personagemCriado.id}/foto`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        } catch (fotoErr) {
          console.error('Personagem criado, mas a foto falhou:', fotoErr)
        }
      }

      navigate(`/sessao/${id}/ficha`)
    } catch (e) {
      console.error(e)
      setErro('Erro ao salvar personagem. Verifique o console.')
    } finally { setSalvando(false) }
  }

  if (verificando) return <div className="cria-loading"><div className="cria-loading-texto">Carregando sessão...</div></div>

  return (
    <div className="ed-wrapper">

      <header className="ed-header">
        <div className="ed-header-esq">
          <span className="ed-header-sessao">{sessao?.nome ?? `Sessão ${id}`}</span>
          <span className="ed-header-np">NP {np} (referência)</span>
        </div>
        <div className="ed-header-mobile-tabs">
          <button className={`ed-tab-btn ${abaMobile === 'editar' ? 'ed-tab-ativa' : ''}`} onClick={() => setAbaMobile('editar')}>✏ Editar</button>
          <button className={`ed-tab-btn ${abaMobile === 'preview' ? 'ed-tab-ativa' : ''}`} onClick={() => setAbaMobile('preview')}>👁 Ver ficha</button>
        </div>
      </header>

      <div className="ed-body">

        {/* ── FORMULÁRIO ── */}
        <div className={`ed-form ${abaMobile === 'editar' ? 'ed-mobile-ativo' : ''}`}>

          <details className="ed-secao" open>
            <summary className="ed-secao-titulo">Nome &amp; Foto</summary>
            <div className="ed-secao-corpo">
              <div className="cria-campo">
                <label>Nome do Herói <span className="cria-campo-obrig">*</span></label>
                <input type="text" placeholder="Ex: Capitão Raio, Sombra, Titã..."
                  value={dados.nome} onChange={e => set('nome', e.target.value)} className="cria-input" />
              </div>
              <div className="cria-campo">
                <label>Foto (fundo da ficha)</label>
                <div className="ed-foto-linha">
                  {fotoPreviewUrl && <img src={fotoPreviewUrl} alt="" className="ed-foto-thumb" />}
                  <label className="ed-btn-secundario">
                    {fotoPreviewUrl ? 'Trocar imagem' : 'Escolher imagem'}
                    <input ref={fotoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoSelect} />
                  </label>
                  {fotoPreviewUrl && (
                    <button type="button" className="ed-btn-remover" onClick={handleFotoRemover}>Remover</button>
                  )}
                </div>
                <span className="cria-campo-dica">Depois de salvar, você pode ajustar posição e zoom da imagem direto na ficha.</span>
              </div>
            </div>
          </details>

          <details className="ed-secao" open>
            <summary className="ed-secao-titulo">Habilidades</summary>
            <div className="ed-secao-corpo">
              <div className="ed-hab-grid">
                {HABILIDADES_CAMPOS.map(({ chave, sigla, nome, desc }) => (
                  <div key={chave} className="ed-hab-campo" title={desc}>
                    <label>{sigla}</label>
                    <input type="number" className="cria-input cria-input-numero"
                      value={dados[chave]} onChange={e => setNum(chave, e.target.value)} />
                    <span className="ed-hab-nome-mini">{nome}</span>
                  </div>
                ))}
              </div>
            </div>
          </details>

          <details className="ed-secao" open>
            <summary className="ed-secao-titulo">Defesas</summary>
            <div className="ed-secao-corpo">
              <p className="cria-secao-info">
                Digite o valor <strong>final</strong> de cada defesa (já somando poderes e vantagens),
                como você faria no papel. A Resistência é a exceção: some Vigor automaticamente.
              </p>
              <div className="ed-def-grid">
                {DEFESAS_CAMPOS.map(({ chave, nome, desc }) => (
                  <div key={chave} className="cria-campo" title={desc}>
                    <label>{nome}</label>
                    <input type="number" className="cria-input cria-input-numero"
                      value={dados[chave]} onChange={e => setNum(chave, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </details>

          <details className="ed-secao" open>
            <summary className="ed-secao-titulo">Poderes</summary>
            <div className="ed-secao-corpo">
              <p className="cria-campo-dica">Use **texto** para negrito. Indente com espaços para hierarquia (efeito → extra/falha).</p>
              <textarea className="cria-textarea ed-textarea-grande" rows={10}
                placeholder={'Corpo Elástico • 44 pontos\n  Alongamento 7\n  **Proteção 14** (Extra: Impenetrável 12; Falha: Limitado à dano físico)'}
                value={dados.poderes_texto} onChange={e => set('poderes_texto', e.target.value)} />
            </div>
          </details>

          <details className="ed-secao" open>
            <summary className="ed-secao-titulo">Perícias</summary>
            <div className="ed-secao-corpo">
              <p className="cria-campo-dica">
                Formato: <code>Nome graduações (+bônus)</code>, separado por vírgula. O bônus entre parênteses é o que aparece na ficha para rolar.
              </p>
              <textarea className="cria-textarea" rows={3}
                placeholder="Atletismo 4 (+6), Tecnologia 4 (+17), Percepção 4 (+8)"
                value={dados.pericias_texto} onChange={e => set('pericias_texto', e.target.value)} />
            </div>
          </details>

          <details className="ed-secao">
            <summary className="ed-secao-titulo">Vantagens</summary>
            <div className="ed-secao-corpo">
              <textarea className="cria-textarea" rows={3}
                placeholder="Ataque à distância, Atraente, Iniciativa aprimorada, Trabalho em equipe..."
                value={dados.vantagens_texto} onChange={e => set('vantagens_texto', e.target.value)} />
            </div>
          </details>

          <details className="ed-secao">
            <summary className="ed-secao-titulo">Equipamentos</summary>
            <div className="ed-secao-corpo">
              <p className="cria-campo-dica">Deixe vazio para ocultar a seção na ficha.</p>
              <textarea className="cria-textarea" rows={3}
                placeholder="Comunicador, Kit médico, Veículo pessoal..."
                value={dados.equipamentos_texto} onChange={e => set('equipamentos_texto', e.target.value)} />
            </div>
          </details>

          <details className="ed-secao">
            <summary className="ed-secao-titulo">Complicações</summary>
            <div className="ed-secao-corpo">
              <textarea className="cria-textarea" rows={4}
                placeholder="Identidade secreta, Inimigo recorrente, Responsabilidade com a família..."
                value={dados.complicacoes_texto} onChange={e => set('complicacoes_texto', e.target.value)} />
            </div>
          </details>

          <details className="ed-secao">
            <summary className="ed-secao-titulo">Citação</summary>
            <div className="ed-secao-corpo">
              <textarea className="cria-textarea" rows={2}
                placeholder="Uma frase marcante do personagem..."
                value={dados.citacao} onChange={e => set('citacao', e.target.value)} />
            </div>
          </details>

          <div className="ed-rodape">
            {erro && <p className="cria-erro">{erro}</p>}
            {!dados.nome.trim() && <p className="cria-aviso">⚠ Preencha o nome do herói para finalizar.</p>}
            <button className="cria-btn-salvar" onClick={salvar} disabled={salvando || !dados.nome.trim()}>
              {salvando ? 'Salvando...' : '✔ Finalizar Personagem e Entrar na Sessão'}
            </button>
          </div>

        </div>

        {/* ── PREVIEW AO VIVO ── */}
        <div className={`ed-preview-col ${abaMobile === 'preview' ? 'ed-mobile-ativo' : ''}`}>
          <div className="ed-preview-sticky">
            <FichaPreviewMini dados={dados} fotoUrl={fotoPreviewUrl} np={np} tipo="jogador" />
          </div>
        </div>

      </div>
    </div>
  )
}

export default CriacaoPersonagem
