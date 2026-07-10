import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import './CriacaoPersonagem.css'
import FichaPreviewMini from '../components/FichaPreviewMini'

// ─── Config dos campos (igual CriacaoPersonagem) ───────────────────────────

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

function EditarPersonagem() {
  const { id, personagemId } = useParams()

  const [carregando, setCarregando] = useState(true)
  const [salvando,   setSalvando]   = useState(false)
  const [erro,       setErro]       = useState('')
  const [sucesso,    setSucesso]    = useState('')
  const [sessao,     setSessao]     = useState(null)
  const [tipoPersonagem, setTipoPersonagem] = useState('jogador')

  const [dados, setDados] = useState(DADOS_INICIAIS)

  const [fotoUrl,        setFotoUrl]        = useState(null) // foto já salva no personagem
  const [fotoFile,       setFotoFile]       = useState(null) // nova foto escolhida (ainda não enviada)
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState(null) // preview local da nova foto
  const [uploadandoFoto, setUploadandoFoto] = useState(false)

  const [abaMobile, setAbaMobile] = useState('editar')

  const fotoInputRef = useRef(null)

  // ─── Carregar dados existentes ──────────────────────────────────────────

  useEffect(() => {
    async function carregar() {
      try {
        const [sessaoResp, personagemResp] = await Promise.all([
          api.get(`/sessoes/${id}`),
          api.get(`/personagens/${personagemId}/completo`),
        ])

        setSessao(sessaoResp.data)

        const p = personagemResp.data
        setTipoPersonagem(p.tipo ?? 'jogador')
        setFotoUrl(p.foto ?? null)

        setDados({
          nome: p.nome ?? '',
          forca: p.forca ?? 0, agilidade: p.agilidade ?? 0, luta: p.luta ?? 0, destreza: p.destreza ?? 0,
          vigor: p.vigor ?? 0, intelecto: p.intelecto ?? 0, consciencia: p.consciencia ?? 0, presenca: p.presenca ?? 0,
          esquiva: p.esquiva ?? 0, aparar: p.aparar ?? 0, fortitude: p.fortitude ?? 0,
          resistencia: p.resistencia ?? 0, vontade: p.vontade ?? 0,
          poderes_texto:      p.poderes_texto      ?? '',
          pericias_texto:     p.pericias_texto     ?? '',
          vantagens_texto:    p.vantagens_texto    ?? '',
          equipamentos_texto: p.equipamentos_texto ?? '',
          complicacoes_texto: p.complicacoes_texto ?? '',
          citacao:            p.citacao            ?? '',
        })
      } catch (e) {
        console.error('Erro ao carregar personagem:', e)
        setErro('Erro ao carregar personagem.')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [id, personagemId])

  useEffect(() => {
    return () => { if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl) }
  }, [fotoPreviewUrl])

  const np    = sessao?.nivel_poder ?? 10
  const ehNPC = tipoPersonagem === 'npc'

  function set(campo, valor) {
    setDados(prev => ({ ...prev, [campo]: valor }))
  }
  function setNum(campo, valor) {
    const n = valor === '' ? 0 : parseInt(valor, 10)
    setDados(prev => ({ ...prev, [campo]: Number.isNaN(n) ? 0 : n }))
  }

  // ─── Foto ──────────────────────────────────────────────────────────────

  function handleFotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl)
    setFotoFile(file)
    setFotoPreviewUrl(URL.createObjectURL(file))
  }

  async function enviarFotoSeHouver() {
    if (!fotoFile) return
    setUploadandoFoto(true)
    try {
      const form = new FormData()
      form.append('foto', fotoFile)
      const resp = await api.post(`/personagens/${personagemId}/foto`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setFotoUrl(resp.data.url)
      if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl)
      setFotoFile(null)
      setFotoPreviewUrl(null)
    } catch (e) {
      console.error('Erro ao enviar foto:', e)
      setErro('Personagem salvo, mas houve erro ao enviar a nova foto.')
    } finally {
      setUploadandoFoto(false)
    }
  }

  // ─── Salvar ──────────────────────────────────────────────────────────────

  async function salvar() {
    if (!dados.nome.trim()) { setErro('O personagem precisa de um nome!'); return }
    setSalvando(true); setErro(''); setSucesso('')
    try {
      await api.put(`/personagens/${personagemId}/completo`, {
        ...dados,
        nome: dados.nome.trim(),
      })
      if (fotoFile) await enviarFotoSeHouver()
      setSucesso('Ficha salva com sucesso!')
      setTimeout(() => window.close(), 1200)
    } catch (e) {
      console.error(e)
      setErro('Erro ao salvar. Verifique o console.')
    } finally { setSalvando(false) }
  }

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (carregando) return (
    <div className="cria-loading">
      <div className="cria-loading-texto">Carregando ficha...</div>
    </div>
  )

  const fotoParaPreview = fotoPreviewUrl || fotoUrl

  return (
    <div className="ed-wrapper">

      <header className="ed-header">
        <div className="ed-header-esq">
          <span className="ed-header-sessao">✏ Editando: {dados.nome || '—'}</span>
          <span className="ed-header-np">{ehNPC ? 'NPC (sem limite de PP)' : `NP ${np} (referência)`}</span>
        </div>
        <div className="ed-header-mobile-tabs">
          <button className={`ed-tab-btn ${abaMobile === 'editar' ? 'ed-tab-ativa' : ''}`} onClick={() => setAbaMobile('editar')}>✏ Editar</button>
          <button className={`ed-tab-btn ${abaMobile === 'preview' ? 'ed-tab-ativa' : ''}`} onClick={() => setAbaMobile('preview')}>👁 Ver ficha</button>
        </div>
      </header>

      <div className="ed-body">

        <div className={`ed-form ${abaMobile === 'editar' ? 'ed-mobile-ativo' : ''}`}>

          <details className="ed-secao" open>
            <summary className="ed-secao-titulo">Nome &amp; Foto</summary>
            <div className="ed-secao-corpo">
              <div className="cria-campo">
                <label>Nome do Personagem <span className="cria-campo-obrig">*</span></label>
                <input type="text" placeholder="Nome do herói ou NPC..."
                  value={dados.nome} onChange={e => set('nome', e.target.value)} className="cria-input" />
              </div>
              <div className="cria-campo">
                <label>Foto (fundo da ficha)</label>
                <div className="ed-foto-linha">
                  {fotoParaPreview && <img src={fotoParaPreview} alt="" className="ed-foto-thumb" />}
                  <label className="ed-btn-secundario">
                    {uploadandoFoto ? 'Enviando...' : fotoParaPreview ? 'Trocar imagem' : 'Escolher imagem'}
                    <input ref={fotoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={handleFotoSelect} disabled={uploadandoFoto} />
                  </label>
                </div>
                <span className="cria-campo-dica">A nova foto é enviada junto ao salvar. Posição/zoom se ajustam direto na ficha.</span>
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
                Digite o valor <strong>final</strong> de cada defesa. A Resistência é a exceção: some Vigor automaticamente.
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
              <p className="cria-campo-dica">Use **texto** para negrito. Indente com espaços para hierarquia.</p>
              <textarea className="cria-textarea ed-textarea-grande" rows={10}
                value={dados.poderes_texto} onChange={e => set('poderes_texto', e.target.value)} />
            </div>
          </details>

          <details className="ed-secao" open>
            <summary className="ed-secao-titulo">Perícias</summary>
            <div className="ed-secao-corpo">
              <p className="cria-campo-dica">Formato: <code>Nome graduações (+bônus)</code>, separado por vírgula.</p>
              <textarea className="cria-textarea" rows={3}
                value={dados.pericias_texto} onChange={e => set('pericias_texto', e.target.value)} />
            </div>
          </details>

          <details className="ed-secao">
            <summary className="ed-secao-titulo">Vantagens</summary>
            <div className="ed-secao-corpo">
              <textarea className="cria-textarea" rows={3}
                value={dados.vantagens_texto} onChange={e => set('vantagens_texto', e.target.value)} />
            </div>
          </details>

          <details className="ed-secao">
            <summary className="ed-secao-titulo">Equipamentos</summary>
            <div className="ed-secao-corpo">
              <p className="cria-campo-dica">Deixe vazio para ocultar a seção na ficha.</p>
              <textarea className="cria-textarea" rows={3}
                value={dados.equipamentos_texto} onChange={e => set('equipamentos_texto', e.target.value)} />
            </div>
          </details>

          <details className="ed-secao">
            <summary className="ed-secao-titulo">Complicações</summary>
            <div className="ed-secao-corpo">
              <textarea className="cria-textarea" rows={4}
                value={dados.complicacoes_texto} onChange={e => set('complicacoes_texto', e.target.value)} />
            </div>
          </details>

          <details className="ed-secao">
            <summary className="ed-secao-titulo">Citação</summary>
            <div className="ed-secao-corpo">
              <textarea className="cria-textarea" rows={2}
                value={dados.citacao} onChange={e => set('citacao', e.target.value)} />
            </div>
          </details>

          <div className="ed-rodape">
            {erro    && <p className="cria-erro">{erro}</p>}
            {sucesso && <p className="ed-sucesso">{sucesso}</p>}
            <button className="cria-btn-salvar" onClick={salvar} disabled={salvando || !dados.nome.trim()}>
              {salvando ? 'Salvando...' : '✔ Salvar Alterações'}
            </button>
          </div>

        </div>

        <div className={`ed-preview-col ${abaMobile === 'preview' ? 'ed-mobile-ativo' : ''}`}>
          <div className="ed-preview-sticky">
            <FichaPreviewMini dados={dados} fotoUrl={fotoParaPreview} np={np} tipo={tipoPersonagem} />
          </div>
        </div>

      </div>
    </div>
  )
}

export default EditarPersonagem
