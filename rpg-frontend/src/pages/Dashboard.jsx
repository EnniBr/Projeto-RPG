import { useState, useEffect } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { useSessao } from '../contexts/SessaoContext'
import ModalNovaCampanha from '../components/ModalNovaCampanha'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const { setSessaoAtiva } = useSessao()
  const token = localStorage.getItem('token')
  const usuario = token ? jwtDecode(token) : {}
  const [modalCampanha, setModalCampanha] = useState(false)

  const [sessoes, setSessoes] = useState([])
  useEffect(() => {
      async function carregarSessoes() {
          try {
              const resposta = await api.get('/sessoes')
              setSessoes(resposta.data)
          } catch (erro) {
              console.error('Erro ao carregar sessões:', erro)
          }
      }
      carregarSessoes()
  }, [])

  function logout() {
    localStorage.removeItem('token')
    navigate('/')
  }

  function entrarSessao(sessao) {
    setSessaoAtiva(sessao)
    if (sessao.mestre_id === usuario.id) {
        navigate(`/sessao/${sessao.id}/mestre`)
    } else {
        navigate(`/sessao/${sessao.id}/criar-personagem`)
    }
}

  return (
    <div className="dash">
      <header className="dash-header">
        <div className="dash-header-esquerda">
          <div className="dash-logo">⬡</div>
          <span className="dash-logo-texto">RPG System</span>
        </div>
        <div className="dash-header-direita">
          <div className="dash-perfil">
            <div className="dash-perfil-avatar">
              {usuario.tipo === 'mestre' ? '👑' : '🦸'}
            </div>
            <div className="dash-perfil-info">
              <span className="dash-perfil-tipo">{usuario.tipo || 'Jogador'}</span>
            </div>
          </div>
          <button className="dash-logout" onClick={logout}>Sair</button>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-topo">
          <div>
            <h1 className="dash-titulo">Suas Campanhas</h1>
            <p className="dash-subtitulo">
              {sessoes.length === 0
                ? 'Nenhuma campanha ainda. Crie ou entre em uma para começar.'
                : `${sessoes.length} campanha${sessoes.length > 1 ? 's' : ''} ativa${sessoes.length > 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>

        <div className="dash-grade">
          {sessoes.map((sessao) => (
            <div key={sessao.id} className="sessao-card">
              <div className="sessao-card-topo">
                <span className="sessao-card-nivel">NP {sessao.nivel_poder}</span>
                <span className={`sessao-card-papel ${sessao.mestre_id === usuario.id ? 'papel-mestre' : 'papel-jogador'}`}>
                  {sessao.mestre_id === usuario.id ? '👑 Mestre' : '🦸 Jogador'}
                </span>
              </div>
              <h3 className="sessao-card-nome">{sessao.nome}</h3>
              <p className="sessao-card-data">
                {new Date(sessao.data).toLocaleDateString('pt-BR')}
              </p>
              <button className="sessao-card-btn" onClick={() => entrarSessao(sessao)}>
                Entrar
              </button>
            </div>
          ))}

          <button className="sessao-card-adicionar" onClick={() => setModalCampanha(true)}>
            <div className="adicionar-icone">+</div>
            <span className="adicionar-texto">Criar ou Entrar<br />em uma Campanha</span>
          </button>
        </div>
      </main>

      {modalCampanha && (
        <ModalNovaCampanha
          onFechar={() => setModalCampanha(false)}
          onCriarSessao={async (dados) => {
            try {
                await api.post('/sessoes', dados)
                const resposta = await api.get('/sessoes')
                setSessoes(resposta.data)
            } catch (erro) {
                console.error('Erro ao criar sessão:', erro)
            }
          }}
          onEntrarSessao={async (codigo) => {
              try {
                  const resposta = await api.post('/sessoes/entrar', { codigo })
                  const { sessao } = resposta.data
                  setSessaoAtiva(sessao)
                  setModalCampanha(false)
                  navigate(`/sessao/${sessao.id}/criar-personagem`)
              } catch (erro) {
                  console.error('Código inválido:', erro)
              }
          }}
        />
      )}
    </div>
  )
}

export default Dashboard