import { useState, useRef, useEffect } from 'react'
import api from '../services/api'
import './ModalCriacaoNPC.css'
import '../pages/CriacaoPersonagem.css'
import FichaPreviewMini from './FichaPreviewMini'

const HABILIDADES_CAMPOS = [
  { chave: 'forca',       sigla: 'FOR' },
  { chave: 'agilidade',   sigla: 'AGI' },
  { chave: 'luta',        sigla: 'LUT' },
  { chave: 'destreza',    sigla: 'DES' },
  { chave: 'vigor',       sigla: 'VIG' },
  { chave: 'intelecto',   sigla: 'INT' },
  { chave: 'consciencia', sigla: 'CON' },
  { chave: 'presenca',    sigla: 'PRE' },
]

const DEFESAS_CAMPOS = [
  { chave: 'esquiva',     nome: 'Esquiva' },
  { chave: 'aparar',      nome: 'Aparar' },
  { chave: 'fortitude',   nome: 'Fortitude' },
  { chave: 'resistencia', nome: 'Resistência (bônus)' },
  { chave: 'vontade',     nome: 'Vontade' },
]

const DADOS_INICIAIS = {
  nome: '',
  nome_civil: '', cidade: '', equipe: '',
  forca: 0, agilidade: 0, luta: 0, destreza: 0, vigor: 0, intelecto: 0, consciencia: 0, presenca: 0,
  esquiva: 0, aparar: 0, fortitude: 0, resistencia: 0, vontade: 0,
  poderes_texto: '', pericias_texto: '', vantagens_texto: '', equipamentos_texto: '', complicacoes_texto: '',
  citacao: '',
  cor_primaria: '#8b0000', cor_secundaria: '#cccccc', tema_blocos: 'escuro',
}

function ModalCriacaoNPC({ sessaoId, onFechar, onNPCCriado, modoOffline = false, onExportarOffline }) {
  const [salvando, setSalvando] = useState(false)
  const [erro,     setErro]     = useState('')

  const [dados, setDados] = useState(DADOS_INICIAIS)

  const [fotoFile,       setFotoFile]       = useState(null)
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState(null)
  const [previewAberto,  setPreviewAberto]  = useState(false)

  const fotoInputRef = useRef(null)

  useEffect(() => {
    return () => { if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl) }
  }, [fotoPreviewUrl])

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

  // ─── Salvar ───────────────────────────────────────────────────────────────

  async function salvar() {
    if (!dados.nome.trim()) { setErro('O NPC precisa de um nome.'); return }

    if (modoOffline) {
      onExportarOffline?.({ ...dados, nome: dados.nome.trim(), tipo: 'npc' })
      return
    }

    setSalvando(true); setErro('')
    try {
      const resp = await api.post('/personagens/criar-completo', {
        sessao_id: Number(sessaoId),
        tipo: 'npc',
        ...dados,
        nome: dados.nome.trim(),
      })

      if (fotoFile && resp.data?.id) {
        const form = new FormData()
        form.append('foto', fotoFile)
        try {
          await api.post(`/personagens/${resp.data.id}/foto`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        } catch (fotoErr) {
          console.error('NPC criado, mas a foto falhou:', fotoErr)
        }
      }

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
                : 'Ficha em texto livre, sem limite de PP — mesmo formato dos jogadores'}
            </p>
          </div>
          <button className="npc-fechar" onClick={onFechar}>✕</button>
        </div>

        <div className="npc-corpo">

          {/* NOME + FOTO */}
          <div className="npc-secao">
            <div className="npc-secao-titulo">Nome</div>
            <input type="text" className="cria-input"
              placeholder="Ex: Dr. Destruição, Guarda Robótico, Criatura das Sombras..."
              value={dados.nome} onChange={e => set('nome', e.target.value)} autoFocus />
          </div>

          <div className="npc-secao">
            <div className="npc-secao-titulo">Identidade</div>
            <div className="ed-hab-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="cria-campo">
                <label>Nome civil</label>
                <input type="text" placeholder="opcional" className="cria-input"
                  value={dados.nome_civil} onChange={e => set('nome_civil', e.target.value)} />
              </div>
              <div className="cria-campo">
                <label>Cidade</label>
                <input type="text" placeholder="opcional" className="cria-input"
                  value={dados.cidade} onChange={e => set('cidade', e.target.value)} />
              </div>
              <div className="cria-campo">
                <label>Equipe</label>
                <input type="text" placeholder="opcional" className="cria-input"
                  value={dados.equipe} onChange={e => set('equipe', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="npc-secao">
            <div className="npc-secao-titulo">Foto (fundo da ficha)</div>
            <div className="ed-foto-linha">
              {fotoPreviewUrl && <img src={fotoPreviewUrl} alt="" className="ed-foto-thumb" />}
              <label className="ed-btn-secundario">
                {fotoPreviewUrl ? 'Trocar imagem' : 'Escolher imagem'}
                <input ref={fotoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoSelect} />
              </label>
            </div>
          </div>

          <div className="npc-secao">
            <div className="npc-secao-titulo">Aparência</div>
            <div className="ed-hab-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="cria-campo">
                <label>Cor primária</label>
                <input type="color" className="cria-input ed-input-cor"
                  value={dados.cor_primaria} onChange={e => set('cor_primaria', e.target.value)} />
              </div>
              <div className="cria-campo">
                <label>Cor secundária</label>
                <input type="color" className="cria-input ed-input-cor"
                  value={dados.cor_secundaria} onChange={e => set('cor_secundaria', e.target.value)} />
              </div>
            </div>
            <div className="ed-tema-opcoes">
              <button type="button"
                className={`ed-btn-secundario ${dados.tema_blocos === 'escuro' ? 'ed-tema-ativo' : ''}`}
                onClick={() => set('tema_blocos', 'escuro')}>🌙 Escuro</button>
              <button type="button"
                className={`ed-btn-secundario ${dados.tema_blocos === 'claro' ? 'ed-tema-ativo' : ''}`}
                onClick={() => set('tema_blocos', 'claro')}>☀️ Claro</button>
            </div>
          </div>

          {/* HABILIDADES */}
          <div className="npc-secao">
            <div className="npc-secao-titulo">Habilidades</div>
            <div className="ed-hab-grid">
              {HABILIDADES_CAMPOS.map(({ chave, sigla }) => (
                <div key={chave} className="ed-hab-campo">
                  <label>{sigla}</label>
                  <input type="number" className="cria-input cria-input-numero"
                    value={dados[chave]} onChange={e => setNum(chave, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* DEFESAS */}
          <div className="npc-secao">
            <div className="npc-secao-titulo">Defesas</div>
            <div className="ed-def-grid">
              {DEFESAS_CAMPOS.map(({ chave, nome }) => (
                <div key={chave} className="cria-campo">
                  <label>{nome}</label>
                  <input type="number" className="cria-input cria-input-numero"
                    value={dados[chave]} onChange={e => setNum(chave, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* PODERES */}
          <div className="npc-secao">
            <div className="npc-secao-titulo">Poderes</div>
            <textarea className="cria-textarea ed-textarea-grande" rows={7}
              placeholder={'Sopro Congelante: Dano 8 (Extra: Área/Cone)\nCarapaça de Gelo: Proteção 6'}
              value={dados.poderes_texto} onChange={e => set('poderes_texto', e.target.value)} />
          </div>

          {/* PERÍCIAS */}
          <div className="npc-secao">
            <div className="npc-secao-titulo">Perícias</div>
            <p className="cria-campo-dica">Formato: <code>Nome graduações (+bônus)</code>, separado por vírgula.</p>
            <textarea className="cria-textarea" rows={2}
              placeholder="Intimidação 6 (+8), Furtividade 4 (+6)"
              value={dados.pericias_texto} onChange={e => set('pericias_texto', e.target.value)} />
          </div>

          {/* VANTAGENS */}
          <div className="npc-secao">
            <div className="npc-secao-titulo">Vantagens</div>
            <textarea className="cria-textarea" rows={2}
              value={dados.vantagens_texto} onChange={e => set('vantagens_texto', e.target.value)} />
          </div>

          {/* COMPLICAÇÕES */}
          <div className="npc-secao">
            <div className="npc-secao-titulo">Complicações</div>
            <textarea className="cria-textarea" rows={2}
              value={dados.complicacoes_texto} onChange={e => set('complicacoes_texto', e.target.value)} />
          </div>

          {/* PREVIEW AO VIVO (colapsável, pra não brigar por espaço no modal) */}
          <div className="npc-secao">
            <button type="button" className="ed-btn-secundario" style={{ width: '100%' }}
              onClick={() => setPreviewAberto(a => !a)}>
              {previewAberto ? '▾ Ocultar pré-visualização' : '▸ 👁 Pré-visualizar ficha'}
            </button>
            {previewAberto && (
              <div style={{ marginTop: 10 }}>
                <FichaPreviewMini dados={dados} fotoUrl={fotoPreviewUrl} tipo="npc" />
              </div>
            )}
          </div>

        </div>

        {/* Rodapé */}
        <div className="npc-rodape">
          {erro && <p className="npc-erro">{erro}</p>}
          <div className="npc-rodape-acoes">
            <button className="npc-btn-cancelar" onClick={onFechar}>Cancelar</button>
            <button className="npc-btn-salvar" onClick={salvar} disabled={salvando || !dados.nome.trim()}>
              {modoOffline ? '📄 Gerar PDF' : salvando ? 'Salvando...' : '✔ Criar NPC'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ModalCriacaoNPC