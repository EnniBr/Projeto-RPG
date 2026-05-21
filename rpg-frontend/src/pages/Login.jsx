import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './Login.css'

function Login({ fecharModal }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setCarregando(true)
    try {
      const resposta = await api.post('/auth/login', { email, senha })
      localStorage.setItem('token', resposta.data.token)
      fecharModal()
      navigate('/dashboard')
    } catch {
      setErro('Email ou senha inválidos')
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={fecharModal} />

      <div className="modal-caixa">
        <button className="modal-fechar" onClick={fecharModal}>✕</button>

        <h2 className="modal-titulo">Entrar no Sistema</h2>
        <p className="modal-subtitulo">Acesse sua conta para continuar</p>

        <div className="modal-campo">
          <label>Email</label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="modal-campo">
          <label>Senha</label>
          <input
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        {erro && <p className="modal-erro">{erro}</p>}

        <button
          className="modal-btn"
          onClick={handleSubmit}
          disabled={carregando}
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </>
  )
}

export default Login