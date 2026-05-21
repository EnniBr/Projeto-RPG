import './LandingPage.css'

function LandingPage({ abrirLogin }) {

  return (
    <div className="landing">

      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-conteudo">
          <p className="hero-pre">Sistema de Gestão para</p>
          <h1 className="hero-titulo">
            <span className="hero-titulo-linha1">Ser um</span>
            <span className="hero-titulo-linha2">Herói</span>
          </h1>
          <p className="hero-descricao">
            Gerencie suas fichas, poderes e sessões em tempo real.<br />
            Tudo que você precisa para aventuras épicas.
          </p>
          <button className="hero-btn" onClick={abrirLogin}>
            <span>Começar Agora</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        <div className="hero-scroll-hint">
          <span>Role para saber mais</span>
          <div className="hero-scroll-arrow" />
        </div>
      </section>

      {/* ===== SOBRE O RPG ===== */}
      <section className="sobre">
        <div className="sobre-container">

          <div className="sobre-bloco">
            <div className="sobre-tag">O que é RPG?</div>
            <h2 className="sobre-titulo">Uma aventura que se <em>vive</em></h2>
            <p className="sobre-texto">
              Já se pegou assistindo a um filme ou série e pensando: 
              "<i>Se fosse eu no lugar desse personagem, faria tudo diferente!</i>"?
            </p>
            <p className="sobre-texto">
              No RPG, <strong>Roleplaying Game ou Jogo de Interpretação</strong>, você tem essa 
              chance. O RPG é um jogo narrativo onde cada jogador interpreta um personagem único 
              em um mundo imaginário. Juntos, vocês constroem histórias épicas guiados por um
              <strong> Mestre</strong>, que narra os cenários, controla os desafios e dá vida ao universo.
            </p>
            <p className="sobre-texto">
              Diferente de jogos de tabuleiro tradicionais, onde o objetivo é dar a volta na 
              mesa ou acumular mais pontos, o RPG é um jogo focado em imaginação, escolhas e 
              contar uma história junto com seus amigos.
            </p>
          </div>

          <div className="sobre-divisor">
            <div className="sobre-divisor-linha" />
            <div className="sobre-divisor-dado">⬡</div>
            <div className="sobre-divisor-linha" />
          </div>

          <div className="sobre-bloco">
            <div className="sobre-tag sobre-tag-vermelho">O Projeto</div>
            <h2 className="sobre-titulo">Seu auxiliar de mesa <em>inteligente</em></h2>
            <p className="sobre-texto">
              Criado para o sistema <strong>Mutantes & Malfeitores 3ª Edição</strong>, este
              auxiliar digital nasceu de uma necessidade real pela complexidade do sistema: gerenciar fichas complexas de
              super-heróis durante partidas dinâmicas é trabalhoso e tira o foco da aventura.
            </p>
            <p className="sobre-texto">
              Com este sistema, jogadores acompanham suas fichas e rolam dados pelo celular
              enquanto o Mestre controla a sessão em tempo real. Barras de vida, poderes,
              perícias e status, tudo sincronizado e na palma da mão.
            </p>
          </div>

          {/* Cards de features */}
          <div className="features">
            <div className="feature-card">
              <div className="feature-icone">⚡</div>
              <h3>Tempo Real</h3>
              <p>Alterações do Mestre aparecem instantaneamente na tela de todos os jogadores.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icone">🎲</div>
              <h3>Rolagem de Dados</h3>
              <p>Dados integrados com histórico de rolagens visível para toda a mesa.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icone">🦸</div>
              <h3>Fichas Completas</h3>
              <p>Atributos, poderes, perícias e vantagens seguindo as regras do M&M 3e.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icone">🗺️</div>
              <h3>Integração com Mapa</h3>
              <p>Sincronização com Owlbear Rodeo para gerenciar tokens no mapa tático.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="cta">
        <div className="cta-container">
          <p className="cta-pre">Pronto para a aventura?</p>
          <h2 className="cta-titulo">Faça parte da mesa</h2>
          <p className="cta-texto">
            Crie sua conta, monte seu personagem e entre na sessão.<br />
            A aventura começa agora.
          </p>
          <button className="cta-btn" onClick={abrirLogin}>
            Criar Conta / Entrar
          </button>
        </div>
        <div className="cta-decoracao">
          <div className="cta-circulo cta-circulo-1" />
          <div className="cta-circulo cta-circulo-2" />
        </div>
      </section>

      {/* ===== RODAPÉ ===== */}
      <footer className="rodape">
        <p>Sistema RPG · Projeto de Portfólio · Desenvolvido com Node.js, React e PostgreSQL</p>
      </footer>

    </div>
  )
}

export default LandingPage
