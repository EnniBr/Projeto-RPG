import { useState } from 'react'
import api from '../services/api'
import './ModalImportarFicha.css'

// ─── Helper: extrair dados do PDF ─────────────────────────────────────────

async function lerFichaPDF(file) {
  const buffer = await file.arrayBuffer()
  const bytes  = new Uint8Array(buffer)
  const text   = new TextDecoder('latin1').decode(bytes)

  const startMarker = '%%FICHA_DATA:'
  const endMarker   = '%%END_FICHA_DATA'
  const startIdx    = text.lastIndexOf(startMarker)
  if (startIdx === -1) throw new Error('Este PDF não contém dados de ficha do sistema.')

  const dataStart = startIdx + startMarker.length
  const endIdx    = text.indexOf(endMarker, dataStart)
  if (endIdx === -1) throw new Error('Dados de ficha corrompidos.')

  const base64 = text.slice(dataStart, endIdx).trim()
  const json   = decodeURIComponent(escape(atob(base64)))
  return JSON.parse(json)
}

// ─── Componente ────────────────────────────────────────────────────────────

function ModalImportarFicha({ sessaoId, personagensExistentes = [], ehMestre = false, onFechar, onImportado }) {
  const [etapa,       setEtapa]       = useState('upload')   // 'upload' | 'opcoes' | 'salvando'
  const [fichaData,   setFichaData]   = useState(null)
  const [erro,        setErro]        = useState('')
  const [carregando,  setCarregando]  = useState(false)

  // Opções de importação
  const [acao,              setAcao]              = useState('novo')       // 'novo' | 'substituir' | 'temporario'
  const [personagemAlvo,    setPersonagemAlvo]    = useState('')           // id do personagem a substituir
  const [usarImagemDoPDF,   setUsarImagemDoPDF]   = useState(true)

  // ─── Ler o PDF ────────────────────────────────────────────────────────

  async function handleArquivo(e) {
    const file = e.target.files[0]
    if (!file) return
    setCarregando(true)
    setErro('')
    try {
      const dados = await lerFichaPDF(file)
      setFichaData(dados)
      setEtapa('opcoes')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  // ─── Importar ────────────────────────────────────────────────────────

  function limparAtributos(atributos) {
    const campos = ['forca','vigor','agilidade','destreza','luta','intelecto','consciencia','presenca','esquiva','aparar','fortitude','vontade']
    const limpo = {}
    campos.forEach(c => { limpo[c] = atributos?.[c] ?? 0 })
    return limpo
  }

  async function importar() {
  if (!fichaData) return
  setEtapa('salvando')
  setErro('')
  try {
    const { atributos, pericias, vantagens, poderes, complicacoes, personagem: pData, imagemBase64 } = fichaData

    if (acao === 'temporario') {
      onImportado({ temporario: true, fichaData })
      onFechar()
      return
    }

    const resp = await api.post('/personagens/criar-completo', {
      sessao_id:    Number(sessaoId),
      nome:         pData.nome,
      tipo:         pData.tipo ?? 'jogador',
      atributos: limparAtributos(atributos),
      pericias:     pericias  ?? [],
      vantagens:    vantagens ?? [],
      poderes:      poderes.map(p => ({
        nome:        p.nome,
        efeito_base: p.efeito_base ?? '',
        graduacoes:  p.graduacoes  ?? 1,
        custo_total: p.custo_total ?? 1,
        extras:      p.extras  ?? [],
        falhas:      p.falhas  ?? [],
        descritores: p.descritores ?? '',
      })) ?? [],
      complicacoes: complicacoes ?? [],
    })

    if (imagemBase64 && usarImagemDoPDF) {
      try {
        const blob = await fetch(imagemBase64).then(r => r.blob())
        const form = new FormData()
        form.append('foto', blob, 'foto.jpg')
        await api.post(`/personagens/${resp.data.id}/foto`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } catch (e) {
        console.warn('Foto não importada:', e)
      }
    }

    onImportado({ novo: true, personagem: resp.data })
    onFechar()
  } catch (err) {
    console.error('Erro ao importar ficha:', err)
    setErro('Erro ao importar. Verifique o console.')
    setEtapa('opcoes')
  }
}

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <>
      <div className="if-overlay" onClick={onFechar} />
      <div className="if-modal">

        {/* Header */}
        <div className="if-header">
          <div>
            <h2 className="if-titulo">Importar Ficha</h2>
            <p className="if-sub">Importe uma ficha exportada pelo sistema</p>
          </div>
          <button className="if-fechar" onClick={onFechar}>✕</button>
        </div>

        <div className="if-corpo">

          {/* ── ETAPA: upload ── */}
          {etapa === 'upload' && (
            <div className="if-upload-area">
              <div className="if-upload-icone">📄</div>
              <p className="if-instrucao">
                Selecione um arquivo PDF exportado pelo sistema
              </p>
              <label className="if-btn-upload">
                {carregando ? '⏳ Lendo arquivo...' : '📁 Escolher PDF'}
                <input type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={handleArquivo} disabled={carregando} />
              </label>
              {erro && <p className="if-erro">{erro}</p>}
            </div>
          )}

          {/* ── ETAPA: opções ── */}
          {etapa === 'opcoes' && fichaData && (
            <div className="if-opcoes">

              {/* Preview dos dados */}
              <div className="if-preview-dados">
                <div className="if-preview-nome">{fichaData.personagem?.nome}</div>
                <div className="if-preview-info">
                  {fichaData.poderes?.length ?? 0} poderes ·{' '}
                  {fichaData.pericias?.length ?? 0} perícias ·{' '}
                  {fichaData.vantagens?.length ?? 0} vantagens
                </div>
                {fichaData.imagemBase64 && (
                  <div className="if-preview-foto">
                    <img src={fichaData.imagemBase64} alt="Foto da ficha" />
                  </div>
                )}
              </div>

              {/* Opção de imagem */}
              {fichaData.imagemBase64 && (
                <label className="if-checkbox-label">
                  <input type="checkbox"
                    checked={usarImagemDoPDF}
                    onChange={e => setUsarImagemDoPDF(e.target.checked)} />
                  Usar a imagem do PDF como foto do personagem
                </label>
              )}

              {/* O que fazer */}
              <div className="if-secao-titulo">O que deseja fazer?</div>

              <div className="if-acoes-grid">
                <button
                  className={`if-acao-card ${acao === 'novo' ? 'ativa' : ''}`}
                  onClick={() => setAcao('novo')}
                >
                  <span className="if-acao-icone">➕</span>
                  <span className="if-acao-label">Adicionar como novo personagem</span>
                  <span className="if-acao-desc">Cria um personagem novo nesta sessão</span>
                </button>

                {personagensExistentes.length > 0 && (
                  <button
                    className={`if-acao-card ${acao === 'substituir' ? 'ativa' : ''}`}
                    onClick={() => setAcao('substituir')}
                  >
                    <span className="if-acao-icone">🔄</span>
                    <span className="if-acao-label">Substituir personagem existente</span>
                    <span className="if-acao-desc">Atualiza os dados de um personagem já cadastrado</span>
                  </button>
                )}

                {ehMestre && (
                  <button
                    className={`if-acao-card ${acao === 'temporario' ? 'ativa' : ''}`}
                    onClick={() => setAcao('temporario')}
                  >
                    <span className="if-acao-icone">⏱</span>
                    <span className="if-acao-label">Usar temporariamente</span>
                    <span className="if-acao-desc">Não salva no banco — só para esta sessão</span>
                  </button>
                )}
              </div>

              {/* Seletor de personagem alvo (se substituir) */}
              {acao === 'substituir' && personagensExistentes.length > 0 && (
                <div className="if-campo">
                  <label className="if-campo-label">Qual personagem substituir?</label>
                  <select className="if-select"
                    value={personagemAlvo}
                    onChange={e => setPersonagemAlvo(e.target.value)}>
                    <option value="">— Selecionar —</option>
                    {personagensExistentes.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              {erro && <p className="if-erro">{erro}</p>}

              {/* Botões */}
              <div className="if-rodape">
                <button className="if-btn-cancelar" onClick={() => setEtapa('upload')}>
                  ← Escolher outro arquivo
                </button>
                <button className="if-btn-importar"
                  onClick={importar}
                  disabled={acao === 'substituir' && !personagemAlvo}>
                  ✔ Importar Ficha
                </button>
              </div>
            </div>
          )}

          {/* ── ETAPA: salvando ── */}
          {etapa === 'salvando' && (
            <div className="if-upload-area">
              <div className="if-upload-icone">⏳</div>
              <p className="if-instrucao">Importando ficha...</p>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default ModalImportarFicha