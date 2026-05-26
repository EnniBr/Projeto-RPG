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
  const fichaRef        = useRef(null)
  const offscreenRef    = useRef(null)

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
    if (!offscreenRef.current) return
    setGerando(true)
    setErro('')
    try {
      // Captura a ficha como imagem
      const canvas = await html2canvas(offscreenRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0d0d0d',
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

            {/* Template off-screen */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
              <FichaTemplate
                ref={offscreenRef}
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

  const FONT_TITULO  = 'Impact, "Arial Narrow", Arial, sans-serif'
  const FONT_NORMAL  = 'Arial, Helvetica, sans-serif'

  // Cores
  const VERMELHO = '#cc3333'
  const FUNDO    = '#0d0d0d'
  const SECAO_BG = '#1c1c1c'
  const BORDA    = '#000000'

  // ── Estilos inline completos ──────────────────────────────────────────

  const S = {
    root: {
      width:           794,
      height:          1123,
      backgroundColor: FUNDO,
      fontFamily:      FONT_NORMAL,
      color:           'white',
      position:        'relative',
      overflow:        'hidden',
      boxSizing:       'border-box',
      margin:          0,
      padding:         0,
    },
    fundo: {
      position:           'absolute',
      inset:              0,
      backgroundImage:    imagemFundo ? `url(${imagemFundo})` : 'none',
      backgroundSize:     'cover',
      backgroundPosition: 'center',
    },
    overlay: {
      position:   'absolute',
      inset:      0,
      background: imagemFundo
        ? 'linear-gradient(to right, rgba(0,0,0,0.92) 55%, rgba(0,0,0,0.55) 100%)'
        : 'none',
    },
    conteudo: {
      position:       'relative',
      zIndex:         1,
      height:         '100%',
      display:        'flex',
      flexDirection:  'column',
    },

    // ── Header ──
    header: {
      background:     `linear-gradient(90deg, ${VERMELHO} 0%, #6b0000 100%)`,
      padding:        '10px 18px',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      borderBottom:   `3px solid #ff2222`,
      flexShrink:     0,
    },
    headerNome: {
      fontFamily:    FONT_TITULO,
      fontSize:      42,
      fontWeight:    900,
      color:         'white',
      letterSpacing: 4,   
      lineHeight:    1,
      textTransform: 'uppercase',
      margin:        0,
      textShadow:    '0 1px 3px rgba(0,0,0,0.8)',
    },
    headerNP: {
      fontFamily:    FONT_TITULO,
      fontSize:      32,
      fontWeight:    900,
      color:         'white',
      letterSpacing: 2,
      margin:        0,
      whiteSpace:    'nowrap',
    },

    // ── Corpo 2 colunas ──
    corpo: {
      display:   'flex',
      flex:      1,
      overflow:  'hidden',
    },

    // Coluna esquerda
    colEsq: {
      width:          490,
      flexShrink:     0,
      padding:        '10px 12px',
      display:        'flex',
      flexDirection:  'column',
      gap:            6,
      borderRight:    `1px solid #2a2a2a`,
      overflowY:      'hidden',
    },

    // Coluna direita
    colDir: {
      flex:           1,
      padding:        '10px 10px',
      display:        'flex',
      flexDirection:  'column',
      gap:            8,
    },

    // ── Grid atributos ──
    atribGrid: {
      display:               'grid',
      gridTemplateColumns:   'repeat(4, 1fr)',
      gap:                   3,
    },
    atribCelula: {
      border:     `1px solid ${BORDA}`,
      overflow:   'hidden',
    },
    atribLabel: {
      backgroundColor: '#ffffff',
      color:           '#000000',
      fontFamily:      FONT_TITULO,
      fontWeight:      700,
      fontSize:        11,
      textAlign:       'center',
      padding:         '2px 0',
      margin:          0,
      lineHeight:      1.3,
    },
    atribValor: {
      backgroundColor: '#2e2e2e',
      color:           '#ffffff',
      fontFamily:      FONT_TITULO,
      fontSize:        22,
      fontWeight:      700,
      textAlign:       'center',
      padding:         '5px 0',
      margin:          0,
      lineHeight:      1,
      WebkitFontSmoothing: 'antialiased',
    },

    // ── Seção genérica ──
    secao: {
      border:        `1px solid ${BORDA}`,
      overflow:      'hidden',
    },
    secaoTitulo: {
      backgroundColor: '#ffffff',
      color:           '#000000',
      fontFamily:      FONT_TITULO,
      fontWeight:      700,
      fontSize:        10,
      textTransform:   'uppercase',
      padding:         '2px 6px',
      borderBottom:    `1px solid ${BORDA}`,
      letterSpacing:   0.5,
      margin:          0,
      lineHeight:      1.4,
    },
    secaoCorpo: {
      backgroundColor: SECAO_BG,
      padding:         '4px 6px',
      margin:          0,
    },
    itemTexto: {
      fontFamily:  FONT_NORMAL,
      fontSize:    9,
      lineHeight:  1.4,
      color:       '#dddddd',
      margin:      '1px 0',
      WebkitFontSmoothing: 'antialiased',
    },
    itemNome: {
      fontFamily:  FONT_NORMAL,
      fontSize:    9,
      fontWeight:  700,
      color:       VERMELHO,
    },

    // ── Combate lado a lado ──
    combateRow: {
      display: 'flex',
      gap:     4,
    },
    combateBloco: {
      flex:   1,
      border: `1px solid ${BORDA}`,
    },

    // ── Foto ──
    fotoBox: {
      width:           '100%',
      aspectRatio:     '3 / 4',   // ← era height: 220 fixo
      backgroundColor: '#111111',
      border:          `1px solid #2a2a2a`,
      borderRadius:    4,
      overflow:        'hidden',
      flexShrink:      0,
    },
    fotoImg: {
      width:      '100%',
      height:     '100%',
      objectFit:  'cover',
      display:    'block',
    },
    fotoPlaceholder: {
      width:           '100%',
      height:          '100%',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      fontSize:        56,
      backgroundColor: '#111111',
    },

    // ── Rodapé ──
    rodape: {
      backgroundColor: '#0a0a0a',
      borderTop:       `1px solid #1a1a1a`,
      padding:         '3px 18px',
      display:         'flex',
      justifyContent:  'space-between',
      flexShrink:      0,
    },
    rodapeTexto: {
      fontFamily: FONT_NORMAL,
      fontSize:   7.5,
      color:      '#444444',
      margin:     0,
    },
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  function Secao({ titulo, children }) {
    return (
      <div style={S.secao}>
        <div style={S.secaoTitulo}>{titulo}</div>
        <div style={S.secaoCorpo}>{children}</div>
      </div>
    )
  }

  function DefRow({ label, valor, passiva }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ ...S.itemTexto, fontWeight: 700, textTransform: 'uppercase', fontSize: 9 }}>{label}</span>
        <span style={{ fontFamily: FONT_TITULO, fontSize: 12, color: passiva ? VERMELHO : 'white', fontWeight: 700 }}>
          {passiva ? valor : `+${valor}`}
        </span>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div ref={ref} style={S.root}>

      {/* Fundo e overlay */}
      <div style={S.fundo} />
      <div style={S.overlay} />

      {/* Conteúdo */}
      <div style={S.conteudo}>

        {/* HEADER */}
        <div style={S.header}>
          <div style={S.headerNome}>{personagem.nome.toUpperCase()}</div>
          <div style={S.headerNP}>NP {np}</div>
        </div>

        {/* CORPO */}
        <div style={S.corpo}>

          {/* ── COLUNA ESQUERDA ── */}
          <div style={S.colEsq}>

            {/* Atributos */}
            <div style={S.atribGrid}>
              {ATRIBUTOS_GRID.map(({ sigla, chave }) => (
                <div key={chave} style={S.atribCelula}>
                  <div style={S.atribLabel}>{sigla}</div>
                  <div style={S.atribValor}>{atributos?.[chave] ?? 0}</div>
                </div>
              ))}
            </div>

            {/* Poderes */}
            {poderes.length > 0 && (
              <Secao titulo="PODERES">
                {poderes.map((p, i) => (
                  <div key={i} style={{ marginBottom: 3 }}>
                    <span style={S.itemNome}>{p.nome}</span>
                    {p.efeito_base && <span style={{ ...S.itemTexto, color: '#aaa' }}> — {p.efeito_base}</span>}
                    <span style={S.itemTexto}> {p.graduacoes}grad</span>
                    {Array.isArray(p.extras) && p.extras.length > 0 && (
                      <span style={{ ...S.itemTexto, color: '#888' }}> · {p.extras.join(', ')}</span>
                    )}
                    {Array.isArray(p.falhas) && p.falhas.length > 0 && (
                      <span style={{ ...S.itemTexto, color: '#888' }}> (Falhas: {p.falhas.join(', ')})</span>
                    )}
                  </div>
                ))}
              </Secao>
            )}

            {/* Perícias */}
            {pericias.length > 0 && (
              <Secao titulo="PERÍCIAS">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px 10px' }}>
                  {pericias.map((p, i) => (
                    <span key={i} style={S.itemTexto}>
                      {p.nome_pericia} <strong style={{ color: VERMELHO }}>+{p.graduacoes}</strong>
                    </span>
                  ))}
                </div>
              </Secao>
            )}

            {/* Vantagens */}
            {vantagens.length > 0 && (
              <Secao titulo="VANTAGENS">
                <div style={S.itemTexto}>
                  {vantagens.map((v, i) => (
                    <span key={i}>
                      {v.nome_vantagem}{v.graduacoes > 1 ? ` ${v.graduacoes}` : ''}
                      {i < vantagens.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              </Secao>
            )}

            {/* Ofensivo + Defensivo */}
            <div style={S.combateRow}>

              <div style={S.combateBloco}>
                <div style={S.secaoTitulo}>OFENSIVO</div>
                <div style={S.secaoCorpo}>
                  <div style={{ ...S.itemTexto, fontWeight: 700, marginBottom: 4 }}>
                    INICIATIVA +{atributos?.consciencia ?? 0}
                  </div>
                  {poderesOfensivos.length === 0
                    ? <div style={{ ...S.itemTexto, color: '#555' }}>—</div>
                    : poderesOfensivos.map((p, i) => (
                      <div key={i} style={{ marginBottom: 4 }}>
                        <div style={S.itemNome}>{p.nome}</div>
                        <div style={{ ...S.itemTexto, color: '#aaa', fontSize: 8.5 }}>
                          Ataque: 1d20+{atributos?.luta ?? 0}
                        </div>
                        <div style={{ ...S.itemTexto, color: '#888', fontSize: 8.5 }}>
                          CD Dano: {15 + (p.graduacoes ?? 0)}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div style={S.combateBloco}>
                <div style={S.secaoTitulo}>DEFENSIVO</div>
                <div style={S.secaoCorpo}>
                  <DefRow label="Esquiva"     valor={(atributos?.agilidade ?? 0) + (atributos?.esquiva ?? 0)}     passiva />
                  <DefRow label="Aparar"      valor={(atributos?.luta ?? 0) + (atributos?.aparar ?? 0)}            passiva />
                  <div style={{ height: 1, backgroundColor: '#333', margin: '3px 0' }} />
                  <DefRow label="Fortitude"   valor={defTotal('fortitude', 'vigor')}        />
                  <DefRow label="Resistência" valor={resistenciaTotal}                       />
                  <DefRow label="Vontade"     valor={defTotal('vontade', 'consciencia')}    />
                </div>
              </div>

            </div>

          </div>

          {/* ── COLUNA DIREITA ── */}
          <div style={S.colDir}>

            {/* Foto */}
            <div style={S.fotoBox}>
              {imagemFundo
                ? <img src={imagemFundo} style={S.fotoImg} alt="" />
                : <div style={S.fotoPlaceholder}>🦸</div>
              }
            </div>

            {/* Complicações */}
            {complicacoes.length > 0 && (
              <Secao titulo="COMPLICAÇÕES">
                {complicacoes.map((c, i) => (
                  <div key={i} style={{ marginBottom: 5 }}>
                    <div style={{ ...S.itemNome, fontSize: 9 }}>{c.titulo}</div>
                    {c.descricao && (
                      <div style={{ ...S.itemTexto, color: '#aaa', fontSize: 8.5, lineHeight: 1.3 }}>
                        {c.descricao}
                      </div>
                    )}
                  </div>
                ))}
              </Secao>
            )}

            {/* Sessão */}
            {sessao && (
              <div style={{ marginTop: 'auto', textAlign: 'center' }}>
                <div style={{ ...S.itemTexto, color: '#444', fontSize: 8 }}>
                  {sessao.nome} · NP {sessao.nivel_poder}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* RODAPÉ */}
        <div style={S.rodape}>
          <span style={S.rodapeTexto}>Mutantes &amp; Malfeitores 3ª Edição</span>
          <span style={S.rodapeTexto}>
            {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>

      </div>
    </div>
  )
})

export default ModalExportarFicha
