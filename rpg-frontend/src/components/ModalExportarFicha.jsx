import { useState, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import './ModalExportarFicha.css'

// ─── Constantes ────────────────────────────────────────────────────────────

const ATRIBUTOS_GRID = [
  { sigla: 'FOR', chave: 'forca'       },
  { sigla: 'AGI', chave: 'agilidade'   },
  { sigla: 'LUT', chave: 'luta'        },
  { sigla: 'PRE', chave: 'presenca'    },
  { sigla: 'VIT', chave: 'vigor'       },
  { sigla: 'DES', chave: 'destreza'    },
  { sigla: 'INT', chave: 'intelecto'   },
  { sigla: 'CON', chave: 'consciencia' },
]

// ─── Helper: crop de imagem ────────────────────────────────────────────────

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src     = imageSrc
  })
  const canvas = document.createElement('canvas')
  canvas.width  = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
  return canvas.toDataURL('image/jpeg', 0.92)
}

// ─── Helper: embutir dados no PDF ──────────────────────────────────────────

function embutirDados(pdfBytes, dados) {
  const json     = JSON.stringify(dados)
  const base64   = btoa(unescape(encodeURIComponent(json)))
  const marker   = `\n%%FICHA_DATA:${base64}%%END_FICHA_DATA\n`
  const extra    = new TextEncoder().encode(marker)
  const combined = new Uint8Array(pdfBytes.byteLength + extra.byteLength)
  combined.set(new Uint8Array(pdfBytes), 0)
  combined.set(extra, pdfBytes.byteLength)
  return combined
}

// ─── Componente ────────────────────────────────────────────────────────────

function ModalExportarFicha({ personagem, atributos, pericias, vantagens, poderes, complicacoes, sessao, onFechar }) {
  const fichaRef = useRef(null)

  // Crop states
  const [imageSrc,           setImageSrc]           = useState(null)
  const [crop,               setCrop]               = useState({ x: 0, y: 0 })
  const [zoom,               setZoom]               = useState(1)
  const [croppedAreaPixels,  setCroppedAreaPixels]  = useState(null)
  const [imagemFinal,        setImagemFinal]        = useState(null) // data URL após crop

  // UI states
  const [etapa,     setEtapa]     = useState('imagem') // 'imagem' | 'preview'
  const [gerando,   setGerando]   = useState(false)
  const [erro,      setErro]      = useState('')

  const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), [])

  // ─── Selecionar imagem ──────────────────────────────────────────────────

  function handleImagemUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result)
    reader.readAsDataURL(file)
  }

  async function confirmarCrop() {
    try {
      const cropped = await getCroppedImg(imageSrc, croppedAreaPixels)
      setImagemFinal(cropped)
      setEtapa('preview')
    } catch (e) {
      setErro('Erro ao processar imagem.')
    }
  }

  function pularImagem() {
    setImagemFinal(null)
    setEtapa('preview')
  }

  // ─── Gerar PDF ──────────────────────────────────────────────────────────

  async function gerarPDF() {
    if (!fichaRef.current) return
    setGerando(true)
    setErro('')
    try {
      // Captura a ficha como imagem
      const canvas = await html2canvas(fichaRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0a0a0a',
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      // Cria o PDF
      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const largura  = pdf.internal.pageSize.getWidth()
      const altura   = pdf.internal.pageSize.getHeight()
      pdf.addImage(imgData, 'JPEG', 0, 0, largura, altura)

      // Embute os dados da ficha
      const fichaData = {
        versao:       '1.0',
        exportadoEm:  new Date().toISOString(),
        personagem:   { nome: personagem.nome, tipo: personagem.tipo },
        atributos,
        pericias,
        vantagens,
        poderes:      poderes.map(p => ({
          nome:        p.nome,
          efeito_base: p.efeito_base,
          graduacoes:  p.graduacoes,
          custo_total: p.custo_total,
          extras:      p.extras,
          falhas:      p.falhas,
          descritores: p.descritores,
        })),
        complicacoes,
        imagemBase64: imagemFinal ?? null, // imagem que o jogador escolheu
      }

      const pdfBytes = pdf.output('arraybuffer')
      const combined = embutirDados(pdfBytes, fichaData)

      // Download
      const blob     = new Blob([combined], { type: 'application/pdf' })
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href         = url
      a.download     = `${personagem.nome.replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      onFechar()
    } catch (e) {
      console.error('Erro ao gerar PDF:', e)
      setErro('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  // ─── Helpers de layout ──────────────────────────────────────────────────

  const np = sessao?.nivel_poder ?? '?'

  const poderProtecao    = poderes.find(p =>
    p.efeito_base?.toLowerCase().includes('proteção') ||
    p.efeito_base?.toLowerCase().includes('protecao')
  )
  const rankProtecao     = poderProtecao?.graduacoes ?? 0
  const resistenciaTotal = (atributos?.vigor ?? 0) + rankProtecao

  function defTotal(comp, base) {
    return (atributos?.[base] ?? 0) + (atributos?.[comp] ?? 0)
  }

  const poderesOfensivos = poderes.filter(p =>
    p.efeito_base?.toLowerCase().includes('dano') ||
    p.efeito_base?.toLowerCase().includes('aflição')
  )

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      <div className="ef-overlay" onClick={onFechar} />
      <div className="ef-modal">

        {/* Header */}
        <div className="ef-header">
          <div>
            <h2 className="ef-titulo">Exportar Ficha</h2>
            <p className="ef-sub">{personagem.nome} · NP {np}</p>
          </div>
          <button className="ef-fechar" onClick={onFechar}>✕</button>
        </div>

        {/* ── ETAPA 1: imagem ── */}
        {etapa === 'imagem' && (
          <div className="ef-corpo">
            {!imageSrc ? (
              <div className="ef-imagem-escolha">
                <p className="ef-instrucao">
                  Escolha uma imagem para o fundo da ficha.<br />
                  <span>Você poderá arrastar e dar zoom para ajustar o enquadramento.</span>
                </p>
                <label className="ef-btn-upload">
                  📁 Escolher Imagem
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagemUpload} />
                </label>
                <button className="ef-btn-pular" onClick={pularImagem}>
                  Continuar sem imagem →
                </button>
              </div>
            ) : (
              <div className="ef-crop-area">
                <p className="ef-instrucao">Arraste para reposicionar · Scroll para zoom</p>
                <div className="ef-cropper-wrapper">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={794 / 1123}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="ef-crop-controles">
                  <label className="ef-zoom-label">
                    Zoom
                    <input type="range" min={1} max={3} step={0.05}
                      value={zoom} onChange={e => setZoom(Number(e.target.value))} />
                  </label>
                  <div className="ef-crop-acoes">
                    <button className="ef-btn-secundario" onClick={() => setImageSrc(null)}>
                      ← Trocar imagem
                    </button>
                    <button className="ef-btn-primario" onClick={confirmarCrop}>
                      Confirmar enquadramento →
                    </button>
                  </div>
                </div>
              </div>
            )}
            {erro && <p className="ef-erro">{erro}</p>}
          </div>
        )}

        {/* ── ETAPA 2: preview + gerar ── */}
        {etapa === 'preview' && (
          <div className="ef-corpo ef-corpo-preview">
            <p className="ef-instrucao" style={{ marginBottom: 12 }}>
              Confira como a ficha ficará no PDF antes de gerar.
            </p>

            {/* Preview escalado */}
            <div className="ef-preview-wrapper">
              <div className="ef-preview-escala">
                <FichaTemplate
                  ref={fichaRef}
                  personagem={personagem}
                  atributos={atributos}
                  pericias={pericias}
                  vantagens={vantagens}
                  poderes={poderes}
                  complicacoes={complicacoes}
                  sessao={sessao}
                  imagemFundo={imagemFinal}
                  np={np}
                  defTotal={defTotal}
                  resistenciaTotal={resistenciaTotal}
                  poderesOfensivos={poderesOfensivos}
                />
              </div>
            </div>

            {erro && <p className="ef-erro">{erro}</p>}

            <div className="ef-acoes">
              <button className="ef-btn-secundario" onClick={() => setEtapa('imagem')}>
                ← Alterar imagem
              </button>
              <button className="ef-btn-primario" onClick={gerarPDF} disabled={gerando}>
                {gerando ? '⏳ Gerando PDF...' : '⬇ Baixar PDF'}
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

// ─── Template da ficha (capturado pelo html2canvas) ─────────────────────────

import { forwardRef } from 'react'

const FichaTemplate = forwardRef(function FichaTemplate({
  personagem, atributos, pericias, vantagens, poderes, complicacoes,
  sessao, imagemFundo, np, defTotal, resistenciaTotal, poderesOfensivos
}, ref) {

  const s = {
    wrapper: {
      width: 794, height: 1123,
      backgroundColor: '#0a0a0a',
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
    },
    fundo: {
      position: 'absolute', inset: 0,
      backgroundImage: imagemFundo ? `url(${imagemFundo})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    overlay: {
      position: 'absolute', inset: 0,
      background: imagemFundo
        ? 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.88) 40%, rgba(0,0,0,0.96) 100%)'
        : 'none',
    },
    conteudo: {
      position: 'relative', zIndex: 1,
      padding: '0',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },

    // Header
    headerBand: {
      background: 'rgba(139,0,0,0.85)',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '2px solid #cc3333',
    },
    nomeHeroi: {
      fontSize: 38, fontWeight: 900,
      letterSpacing: -1, lineHeight: 1,
      textTransform: 'uppercase',
      color: 'white',
    },
    npBadge: {
      fontSize: 28, fontWeight: 900,
      color: 'white', letterSpacing: 1,
      whiteSpace: 'nowrap',
    },

    // Corpo principal — 2 colunas
    corpo: {
      display: 'flex', flex: 1, gap: 0,
    },
    colunaEsq: {
      flex: '0 0 490px',
      padding: '12px 14px',
      borderRight: '1px solid #333',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      overflowY: 'hidden',
    },
    colunaDir: {
      flex: 1,
      padding: '12px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },

    // Grid atributos
    atribGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 4,
    },
    atribCelula: {
      border: '1px solid #000',
      overflow: 'hidden',
    },
    atribTitulo: {
      backgroundColor: '#ffffff',
      color: '#000',
      fontWeight: 700,
      fontSize: 11,
      textAlign: 'center',
      padding: '2px 0',
    },
    atribValor: {
      backgroundColor: '#2a2a2a',
      color: '#fff',
      fontSize: 20,
      fontWeight: 700,
      textAlign: 'center',
      padding: '4px 0',
    },

    // Seções
    secao: {
      border: '1px solid #000',
    },
    secaoTitulo: {
      backgroundColor: '#ffffff',
      color: '#000',
      fontWeight: 700,
      fontSize: 10,
      textTransform: 'uppercase',
      padding: '2px 6px',
      borderBottom: '1px solid #000',
      letterSpacing: 0.5,
    },
    secaoConteudo: {
      backgroundColor: '#1e1e1e',
      padding: '4px 6px',
      fontSize: 9.5,
      lineHeight: 1.4,
      color: '#eee',
    },

    // Ofensivo / defensivo lado a lado
    combateRow: {
      display: 'flex', gap: 6,
    },
    combateBloco: {
      flex: 1, border: '1px solid #000',
    },

    // Foto do personagem na coluna direita
    fotoWrapper: {
      width: '100%',
      aspectRatio: '3/4',
      backgroundColor: '#111',
      border: '1px solid #333',
      borderRadius: 4,
      overflow: 'hidden',
      flexShrink: 0,
    },
    fotoImg: {
      width: '100%', height: '100%',
      objectFit: 'cover',
    },
    fotoPlaceholder: {
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 48, backgroundColor: '#111',
    },

    // Rodapé
    rodape: {
      backgroundColor: '#111',
      borderTop: '1px solid #333',
      padding: '4px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 8,
      color: '#555',
    },
  }

  function LinhaTexto({ label, valor, cor }) {
    return (
      <div style={{ display: 'flex', gap: 4, marginBottom: 1 }}>
        <strong style={{ color: cor ?? '#cc3333', fontSize: 9 }}>{label}</strong>
        <span style={{ fontSize: 9 }}>{valor}</span>
      </div>
    )
  }

  return (
    <div ref={ref} style={s.wrapper}>
      {/* Fundo */}
      <div style={s.fundo} />
      <div style={s.overlay} />

      {/* Conteúdo */}
      <div style={s.conteudo}>

        {/* HEADER */}
        <div style={s.headerBand}>
          <div style={s.nomeHeroi}>{personagem.nome}</div>
          <div style={s.npBadge}>NP {np}</div>
        </div>

        {/* CORPO */}
        <div style={s.corpo}>

          {/* COLUNA ESQUERDA */}
          <div style={s.colunaEsq}>

            {/* Atributos */}
            <div style={s.atribGrid}>
              {ATRIBUTOS_GRID.map(({ sigla, chave }) => (
                <div key={chave} style={s.atribCelula}>
                  <div style={s.atribTitulo}>{sigla}</div>
                  <div style={s.atribValor}>{atributos?.[chave] ?? 0}</div>
                </div>
              ))}
            </div>

            {/* Poderes */}
            {poderes.length > 0 && (
              <div style={s.secao}>
                <div style={s.secaoTitulo}>Poderes</div>
                <div style={s.secaoConteudo}>
                  {poderes.map(p => (
                    <div key={p.id ?? p.uid} style={{ marginBottom: 2 }}>
                      <strong style={{ color: '#cc3333' }}>{p.nome}</strong>
                      {p.efeito_base && <span style={{ color: '#aaa' }}> — {p.efeito_base}</span>}
                      <span> {p.graduacoes}grad</span>
                      {p.extras?.length > 0 && <span style={{ color: '#888' }}> · Extras: {Array.isArray(p.extras) ? p.extras.join(', ') : p.extras}</span>}
                      {p.falhas?.length > 0 && <span style={{ color: '#888' }}> · Falhas: {Array.isArray(p.falhas) ? p.falhas.join(', ') : p.falhas}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Perícias */}
            {pericias.length > 0 && (
              <div style={s.secao}>
                <div style={s.secaoTitulo}>Perícias</div>
                <div style={{ ...s.secaoConteudo, display: 'flex', flexWrap: 'wrap', gap: '0 12px' }}>
                  {pericias.map(p => (
                    <span key={p.id}>
                      {p.nome_pericia} <strong style={{ color: '#cc3333' }}>+{p.graduacoes}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vantagens */}
            {vantagens.length > 0 && (
              <div style={s.secao}>
                <div style={s.secaoTitulo}>Vantagens</div>
                <div style={s.secaoConteudo}>
                  {vantagens.map((v, i) => (
                    <span key={v.id}>
                      {v.nome_vantagem}{v.graduacoes > 1 ? ` ${v.graduacoes}` : ''}
                      {i < vantagens.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ofensivo + Defensivo lado a lado */}
            <div style={s.combateRow}>

              {/* Ofensivo */}
              <div style={s.combateBloco}>
                <div style={s.secaoTitulo}>Ofensivo</div>
                <div style={s.secaoConteudo}>
                  <div style={{ fontWeight: 700, fontSize: 9, marginBottom: 3 }}>
                    INICIATIVA +{atributos?.consciencia ?? 0}
                  </div>
                  {poderesOfensivos.map(p => (
                    <div key={p.id ?? p.uid} style={{ marginBottom: 2 }}>
                      <strong style={{ color: '#cc3333' }}>{p.nome}</strong>
                      <div style={{ fontSize: 8.5, color: '#bbb' }}>
                        Ataque: 1d20+{atributos?.luta ?? 0} · CD {15 + p.graduacoes}
                      </div>
                    </div>
                  ))}
                  {poderesOfensivos.length === 0 && (
                    <span style={{ color: '#666', fontSize: 9 }}>Sem poderes ofensivos</span>
                  )}
                </div>
              </div>

              {/* Defensivo */}
              <div style={s.combateBloco}>
                <div style={s.secaoTitulo}>Defensivo</div>
                <div style={s.secaoConteudo}>
                  {[
                    { label: 'Esquiva',    valor: (atributos?.agilidade ?? 0) + (atributos?.esquiva ?? 0),   passiva: true  },
                    { label: 'Aparar',     valor: (atributos?.luta ?? 0) + (atributos?.aparar ?? 0),          passiva: true  },
                    { label: 'Fortitude',  valor: defTotal('fortitude', 'vigor'),                             passiva: false },
                    { label: 'Resistência',valor: resistenciaTotal,                                           passiva: false },
                    { label: 'Vontade',    valor: defTotal('vontade', 'consciencia'),                         passiva: false },
                  ].map(({ label, valor, passiva }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 600 }}>{label}</span>
                      <strong style={{ color: passiva ? '#cc3333' : 'white', fontSize: 10 }}>
                        {passiva ? valor : `+${valor}`}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA */}
          <div style={s.colunaDir}>

            {/* Foto */}
            <div style={s.fotoWrapper}>
              {imagemFundo
                ? <img src={imagemFundo} style={s.fotoImg} alt="" crossOrigin="anonymous" />
                : <div style={s.fotoPlaceholder}>🦸</div>
              }
            </div>

            {/* Complicações */}
            {complicacoes.length > 0 && (
              <div style={s.secao}>
                <div style={s.secaoTitulo}>Complicações</div>
                <div style={s.secaoConteudo}>
                  {complicacoes.map(c => (
                    <div key={c.id} style={{ marginBottom: 4 }}>
                      <strong style={{ color: '#cc3333', fontSize: 9 }}>{c.titulo}</strong>
                      {c.descricao && <div style={{ fontSize: 8.5, color: '#aaa', lineHeight: 1.3 }}>{c.descricao}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sessão */}
            {sessao && (
              <div style={{ marginTop: 'auto', fontSize: 8.5, color: '#555', textAlign: 'center' }}>
                {sessao.nome} · NP {sessao.nivel_poder}
              </div>
            )}

          </div>
        </div>

        {/* RODAPÉ */}
        <div style={s.rodape}>
          <span>Mutantes &amp; Malfeitores 3ª Edição</span>
          <span>Exportado em {new Date().toLocaleDateString('pt-BR')}</span>
        </div>

      </div>
    </div>
  )
})

export default ModalExportarFicha
