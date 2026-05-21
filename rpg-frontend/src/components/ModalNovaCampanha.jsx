import { useState } from 'react'
import './ModalNovaCampanha.css'

// Conteúdo dos tutoriais
const TUTORIAIS = {
  mestreRpg: {
    titulo: 'Bem-vindo ao Mundo do RPG de Mesa',
    icone: '🎭',
    topicos: [
      { titulo: 'Seu papel como Mestre', texto: 'O Mestre é o narrador e árbitro da história. Você descreve o mundo, interpreta personagens secundários (NPCs) e decide as consequências das ações dos jogadores. Seu objetivo não é vencer — é criar uma experiência memorável para todos.' },
      { titulo: 'A Regra de Ouro', texto: 'As regras existem para servir a diversão, não o contrário. Se uma regra está atrapalhando a história, adapte-a. O que importa é que todos na mesa estejam se divertindo e engajados na narrativa.' },
      { titulo: 'Preparação vs Improvisação', texto: 'Você não precisa planejar tudo. Prepare situações e personagens interessantes, mas esteja pronto para improvisar quando os jogadores fizerem algo inesperado — e eles sempre farão. A improvisação é onde a mágica acontece.' },
      { titulo: 'Diga "Sim, e..." ou "Sim, mas..."', texto: 'Quando um jogador propõe uma ação criativa, tente encontrar uma forma de torná-la possível com consequências interessantes. "Sim, você pula entre os prédios, mas precisará rolar Agilidade para não cair" é muito mais divertido do que um simples "não".' },
    ]
  },
  mestreMM: {
    titulo: 'Mutantes & Malfeitores — Guia do Mestre',
    icone: '⚡',
    topicos: [
      { titulo: 'O Nível de Poder (NP)', texto: 'O NP define o poder geral da campanha. NP 10 é o padrão para heróis de nível médio (pense em Homem-Aranha). NP 6 é para heróis de rua, NP 15+ para heróis cósmicos. Todos os limites de atributos e poderes são baseados no NP escolhido.' },
      { titulo: 'Pontos de Poder (PP)', texto: 'Cada jogador começa com NP × 15 pontos para construir seu herói. Esses pontos compram tudo: habilidades, poderes, perícias e vantagens. Como Mestre, você define o NP — e portanto o orçamento de cada jogador.' },
      { titulo: 'Os Limites de Poder', texto: 'Nenhum atributo ofensivo ou defensivo pode ultrapassar o NP. Ataque + Dano ≤ NP×2, e Esquiva + Resistência ≤ NP×2. Esses limites evitam personagens quebrados e mantêm o combate equilibrado.' },
      { titulo: 'Complicações são Oportunidades', texto: 'Personagens em M&M têm Complicações — fraquezas e problemas pessoais. Como Mestre, use-as para criar drama! Quando você coloca um herói em apuros por causa de uma Complicação, ele ganha um Ponto de Herói para usar depois.' },
    ]
  },
  jogadorRpg: {
    titulo: 'Bem-vindo ao RPG de Mesa',
    icone: '🎲',
    topicos: [
      { titulo: 'O que é RPG?', texto: 'RPG (Roleplaying Game) é um jogo colaborativo de contar histórias. Você interpreta um personagem em um mundo imaginário, toma decisões por ele e vive aventuras junto com outros jogadores. Não há tabuleiro fixo — a história acontece na imaginação de todos.' },
      { titulo: 'Seu personagem, suas escolhas', texto: 'Diferente de videogames, aqui você pode tentar qualquer coisa. Quer convencer o vilão em vez de lutar? Pode tentar. Quer escalar um prédio pelo lado de fora? Tente. O Mestre avalia se você tem chance e pede uma rolagem de dado quando necessário.' },
      { titulo: 'Os dados decidem o incerto', texto: 'Quando o resultado de uma ação é incerto, você rola dados. No M&M usamos um d20 (dado de 20 faces) e somamos um bônus do seu personagem. Quanto maior o resultado, melhor. Mas mesmo heróis falham às vezes — e isso cria as melhores histórias.' },
      { titulo: 'Trabalho em equipe', texto: 'Você raramente age sozinho. Cada personagem tem pontos fortes e fracos. Um herói com super força pode precisar de alguém com inteligência aguçada para resolver um enigma. A cooperação é o coração do jogo.' },
    ]
  },
  jogadorMM: {
    titulo: 'Mutantes & Malfeitores — Para Jogadores',
    icone: '🦸',
    topicos: [
      { titulo: 'Você é um super-herói', texto: 'M&M é um RPG de super-heróis. Seu personagem tem poderes extraordinários — voar, manipular energia, força sobre-humana. O sistema é baseado em quadrinhos, então pense no seu herói como um personagem de HQ com uma história e motivação únicos.' },
      { titulo: 'Como funcionam os poderes', texto: 'Poderes têm Graduações — quanto maior, mais poderoso. Um Dano 5 faz menos estrago que um Dano 10. Você compra Graduações com Pontos de Poder durante a criação do personagem. Poderes também podem ter Extras (melhorias) e Falhas (limitações que barateiam o custo).' },
      { titulo: 'Resistência e Machucados', texto: 'Quando você é atingido, rola Resistência contra o dano. Se falhar por pouco, fica Atordoado. Se falhar feio, leva um Machucado — que acumula e piora suas rolagens. Com 4 Machucados você é Incapacitado. Diferente de outros sistemas, não tem "pontos de vida" — é tudo baseado em rolagens.' },
      { titulo: 'Pontos de Herói', texto: 'Você começa cada sessão com 1 Ponto de Herói. Pode ganhar mais quando o Mestre ativa suas Complicações. Use-os para Retentar uma rolagem, Criar um Detalhe na cena, ou Recuperar mais rápido. Guarde para os momentos que realmente importam.' },
    ]
  }
}

function Tutorial({ dados, onContinuar, textoBotao }) {
  return (
    <div className="tutorial">
      <div className="tutorial-icone">{dados.icone}</div>
      <h2 className="tutorial-titulo">{dados.titulo}</h2>
      <div className="tutorial-topicos">
        {dados.topicos.map((t, i) => (
          <div key={i} className="tutorial-topico" style={{ animationDelay: `${i * 0.1}s` }}>
            <h4>{t.titulo}</h4>
            <p>{t.texto}</p>
          </div>
        ))}
      </div>
      <button className="modal-btn-primario" onClick={onContinuar}>
        {textoBotao || 'Continuar →'}
      </button>
    </div>
  )
}

function ModalNovaCampanha({ onFechar, onEntrarSessao, onCriarSessao }) {
  const [passo, setPasso] = useState('escolha') 
  // escolha → nivelMestre / codigoJogador → tutoriais → fim

  const [nivelMestre, setNivelMestre] = useState(null)
  const [nivelJogador, setNivelJogador] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [erroCodigo, setErroCodigo] = useState('')

  function handleEscolhaNivel(nivel) {
    setNivelMestre(nivel)
    if (nivel === 'experiente') {
      setPasso('criarSessao')
    } else if (nivel === 'semRpg') {
      setPasso('tutorialMestreRpg')
    } else {
      setPasso('tutorialMestreMM')
    }
  }

  function handleEscolhaNivelJogador(nivel) {
    setNivelJogador(nivel)
    if (nivel === 'conhece') {
      setPasso('criarPersonagem')
    } else if (nivel === 'semRpg') {
      setPasso('tutorialJogadorRpg')
    } else {
      setPasso('tutorialJogadorMM')
    }
  }

  async function handleEntrarCodigo() {
    if (!codigo.trim()) {
      setErroCodigo('Digite o código da sessão')
      return
    }
    // Futuramente vai validar o código na API
    // Por ora avança para escolha de nível do jogador
    setPasso('nivelJogador')
  }

  return (
    <>
      <div className="modal-overlay" onClick={onFechar} />
      <div className="modal-caixa modal-campanha">
        <button className="modal-fechar" onClick={onFechar}>✕</button>

        {/* PASSO 1 — Criar ou Entrar */}
        {passo === 'escolha' && (
          <div className="modal-passo">
            <h2 className="modal-titulo">Nova Campanha</h2>
            <p className="modal-subtitulo">O que você quer fazer?</p>
            <div className="opcoes-grid">
              <button className="opcao-card" onClick={() => setPasso('nivelMestre')}>
                <span className="opcao-icone">👑</span>
                <span className="opcao-nome">Criar Sessão</span>
                <span className="opcao-desc">Seja o Mestre de uma nova campanha</span>
              </button>
              <button className="opcao-card" onClick={() => setPasso('codigoJogador')}>
                <span className="opcao-icone">🦸</span>
                <span className="opcao-nome">Entrar em Sessão</span>
                <span className="opcao-desc">Entre em uma campanha com um código</span>
              </button>
            </div>
          </div>
        )}

        {/* PASSO — Código do Jogador */}
        {passo === 'codigoJogador' && (
          <div className="modal-passo">
            <button className="modal-voltar" onClick={() => setPasso('escolha')}>← Voltar</button>
            <h2 className="modal-titulo">Entrar em Sessão</h2>
            <p className="modal-subtitulo">Peça o código da sessão ao seu Mestre</p>
            <div className="modal-campo">
              <label>Código da Sessão</label>
              <input
                type="text"
                placeholder="Ex: HERO-4829"
                value={codigo}
                onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setErroCodigo('') }}
                className="input-codigo"
              />
              {erroCodigo && <p className="modal-erro">{erroCodigo}</p>}
            </div>
            <button className="modal-btn-primario" onClick={handleEntrarCodigo}>
              Confirmar →
            </button>
          </div>
        )}

        {/* PASSO — Nível do Mestre */}
        {passo === 'nivelMestre' && (
          <div className="modal-passo">
            <button className="modal-voltar" onClick={() => setPasso('escolha')}>← Voltar</button>
            <h2 className="modal-titulo">Qual sua experiência?</h2>
            <p className="modal-subtitulo">Vamos personalizar sua experiência como Mestre</p>
            <div className="opcoes-lista">
              <button className="opcao-nivel" onClick={() => handleEscolhaNivel('semRpg')}>
                <span className="nivel-icone">🌱</span>
                <div>
                  <strong>Já joguei RPG, mas nunca mestrei</strong>
                  <p>Conheço o básico de RPG mas nunca fui o Mestre</p>
                </div>
              </button>
              <button className="opcao-nivel" onClick={() => handleEscolhaNivel('semMM')}>
                <span className="nivel-icone">⚡</span>
                <div>
                  <strong>Nunca mestrei M&M</strong>
                  <p>Já mestrei outros sistemas, mas não Mutantes & Malfeitores</p>
                </div>
              </button>
              <button className="opcao-nivel" onClick={() => handleEscolhaNivel('experiente')}>
                <span className="nivel-icone">👑</span>
                <div>
                  <strong>Já sou experiente</strong>
                  <p>Conheço bem o sistema e quero ir direto ao ponto</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PASSO — Nível do Jogador */}
        {passo === 'nivelJogador' && (
          <div className="modal-passo">
            <h2 className="modal-titulo">Qual sua experiência?</h2>
            <p className="modal-subtitulo">Vamos te ajudar a criar seu personagem</p>
            <div className="opcoes-lista">
              <button className="opcao-nivel" onClick={() => handleEscolhaNivelJogador('semRpg')}>
                <span className="nivel-icone">🌱</span>
                <div>
                  <strong>Nunca tive contato com RPG</strong>
                  <p>É minha primeira vez jogando qualquer RPG de mesa</p>
                </div>
              </button>
              <button className="opcao-nivel" onClick={() => handleEscolhaNivelJogador('semMM')}>
                <span className="nivel-icone">🎲</span>
                <div>
                  <strong>Nunca joguei M&M</strong>
                  <p>Conheço RPG mas nunca joguei Mutantes & Malfeitores</p>
                </div>
              </button>
              <button className="opcao-nivel" onClick={() => handleEscolhaNivelJogador('conhece')}>
                <span className="nivel-icone">🦸</span>
                <div>
                  <strong>Já conheço M&M</strong>
                  <p>Estou familiarizado com o sistema</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TUTORIAIS MESTRE */}
        {passo === 'tutorialMestreRpg' && (
          <Tutorial
            dados={TUTORIAIS.mestreRpg}
            onContinuar={() => setPasso('tutorialMestreMM')}
          />
        )}

        {passo === 'tutorialMestreMM' && (
          <Tutorial
            dados={TUTORIAIS.mestreMM}
            onContinuar={() => setPasso('criarSessao')}
            textoBotao="Criar minha Campanha →"
          />
        )}

        {/* TUTORIAIS JOGADOR */}
        {passo === 'tutorialJogadorRpg' && (
          <Tutorial
            dados={TUTORIAIS.jogadorRpg}
            onContinuar={() => setPasso('tutorialJogadorMM')}
          />
        )}

        {passo === 'tutorialJogadorMM' && (
          <Tutorial
            dados={TUTORIAIS.jogadorMM}
            onContinuar={() => setPasso('criarPersonagem')}
            textoBotao="Criar meu Personagem →"
          />
        )}

        {/* PASSO FINAL — Criar Sessão (Mestre) */}
        {passo === 'criarSessao' && (
          <div className="modal-passo">
            <h2 className="modal-titulo">Criar Campanha</h2>
            <p className="modal-subtitulo">Configure sua sessão</p>
            <CriarSessaoForm onCriar={onCriarSessao} onFechar={onFechar} />
          </div>
        )}

        {/* PASSO FINAL — Criar Personagem (Jogador) */}
        {passo === 'criarPersonagem' && (
          <div className="modal-passo">
            <h2 className="modal-titulo">Tudo pronto!</h2>
            <p className="modal-subtitulo">Vamos criar seu personagem</p>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🦸</div>
              <p style={{ color: '#888', fontFamily: 'Crimson Pro, serif', fontSize: '1.1rem', marginBottom: '32px' }}>
                Você vai ser direcionado para a tela de criação de personagem.
              </p>
              <button className="modal-btn-primario" onClick={() => { onEntrarSessao(codigo); onFechar() }}>
                Criar Personagem →
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

// Formulário de criação de sessão separado para clareza
function CriarSessaoForm({ onCriar, onFechar }) {
  const [nome, setNome] = useState('')
  const [nivelPoder, setNivelPoder] = useState(10)
  const [erro, setErro] = useState('')

  function handleSubmit() {
    if (!nome.trim()) { setErro('Digite um nome para a campanha'); return }
    onCriar({ nome, nivel_poder: nivelPoder })
    onFechar()
  }

  return (
    <div className="criar-sessao-form">
      <div className="modal-campo">
        <label>Nome da Campanha</label>
        <input
          type="text"
          placeholder="Ex: A Liga dos Prodígios"
          value={nome}
          onChange={(e) => { setNome(e.target.value); setErro('') }}
        />
        {erro && <p className="modal-erro">{erro}</p>}
      </div>

      <div className="modal-campo">
        <label>Nível de Poder (NP)</label>
        <div className="np-selector">
          <button onClick={() => setNivelPoder(p => Math.max(1, p - 1))}>−</button>
          <div className="np-valor">
            <span className="np-numero">{nivelPoder}</span>
            <span className="np-pp">{nivelPoder * 15} PP por jogador</span>
          </div>
          <button onClick={() => setNivelPoder(p => Math.min(20, p + 1))}>+</button>
        </div>
        <p className="np-dica">
          {nivelPoder <= 6 && '🏙️ Heróis de rua — poderes limitados, aventuras urbanas'}
          {nivelPoder >= 7 && nivelPoder <= 10 && '⚡ Heróis clássicos — nível Homem-Aranha / Demolidor'}
          {nivelPoder >= 11 && nivelPoder <= 14 && '🦸 Heróis poderosos — nível Capitão América / Lanterna Verde'}
          {nivelPoder >= 15 && '🌌 Heróis cósmicos — nível Thor / Superman'}
        </p>
      </div>

      <button className="modal-btn-primario" onClick={handleSubmit}>
        Criar Campanha →
      </button>
    </div>
  )
}

export default ModalNovaCampanha
