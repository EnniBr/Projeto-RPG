import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './Login.css'

const API_URL = import.meta.env.VITE_API_URL

function Login({ fecharModal }) {
  const [modo,           setModo]           = useState('login')
  const [email,          setEmail]          = useState('')
  const [senha,          setSenha]          = useState('')
  const [nome,           setNome]           = useState('')
  const [emailCad,       setEmailCad]       = useState('')
  const [senhaCad,       setSenhaCad]       = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro,           setErro]           = useState('')
  const [sucesso,        setSucesso]        = useState('')
  const [carregando,     setCarregando]     = useState(false)

  const navigate = useNavigate()

  function trocarModo(novoModo) { setModo(novoModo); setErro(''); setSucesso('') }

  async function handleLogin(e) {
    e.preventDefault()
    setCarregando(true); setErro('')
    try {
      const resp = await api.post('/auth/login', { email, senha })
      localStorage.setItem('token', resp.data.token)
      fecharModal()
      navigate('/dashboard')
    } catch (err) {
      setErro(err.response?.data?.mensagem ?? 'Email ou senha inválidos.')
    } finally { setCarregando(false) }
  }

  async function handleCadastro(e) {
    e.preventDefault()
    setErro(''); setSucesso('')
    if (!nome.trim())        { setErro('Preencha seu nome.'); return }
    if (!emailCad.trim())    { setErro('Preencha seu email.'); return }
    if (senhaCad.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (senhaCad !== confirmarSenha) { setErro('As senhas não coincidem.'); return }
    setCarregando(true)
    try {
      await api.post('/auth/cadastrar', { nome: nome.trim(), email: emailCad.trim(), senha: senhaCad })
      setSucesso('Conta criada! Faça login para continuar.')
      setNome(''); setEmailCad(''); setSenhaCad(''); setConfirmarSenha('')
      setTimeout(() => trocarModo('login'), 2000)
    } catch (err) {
      setErro(err.response?.data?.mensagem ?? 'Erro ao criar conta.')
    } finally { setCarregando(false) }
  }

  const BotaoGoogle = ({ texto }) => (
    <a href={`${API_URL}/auth/google`} className="modal-btn-google">
      <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
        <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
      </svg>
      {texto}
    </a>
  )

  return (
    <>
      <div className="modal-overlay" onClick={fecharModal} />
      <div className="modal-caixa">
        <button className="modal-fechar" onClick={fecharModal}>✕</button>

        <div className="modal-abas">
          <button className={`modal-aba ${modo === 'login'    ? 'modal-aba-ativa' : ''}`} onClick={() => trocarModo('login')}>Entrar</button>
          <button className={`modal-aba ${modo === 'cadastro' ? 'modal-aba-ativa' : ''}`} onClick={() => trocarModo('cadastro')}>Cadastrar</button>
        </div>

        {/* ── LOGIN ── */}
        {modo === 'login' && (
          <>
            <h2 className="modal-titulo">Entrar no Sistema</h2>
            <p className="modal-subtitulo">Acesse sua conta para continuar</p>
            <BotaoGoogle texto="Entrar com Google" />
            <div className="modal-divisor"><span>ou</span></div>
            <div className="modal-campo">
              <label>Email</label>
              <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="modal-campo">
              <label>Senha</label>
              <input type="password" placeholder="••••••••" value={senha}
                onChange={e => setSenha(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin(e)} />
            </div>
            {erro && <p className="modal-erro">{erro}</p>}
            <button className="modal-btn" onClick={handleLogin} disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </>
        )}

        {/* ── CADASTRO ── */}
        {modo === 'cadastro' && (
          <>
            <h2 className="modal-titulo">Criar Conta</h2>
            <p className="modal-subtitulo">Preencha os dados para se cadastrar</p>
            <BotaoGoogle texto="Cadastrar com Google" />
            <div className="modal-divisor"><span>ou</span></div>
            <div className="modal-campo">
              <label>Nome</label>
              <input type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div className="modal-campo">
              <label>Email</label>
              <input type="email" placeholder="seu@email.com" value={emailCad} onChange={e => setEmailCad(e.target.value)} />
            </div>
            <div className="modal-campo">
              <label>Senha</label>
              <input type="password" placeholder="Mínimo 6 caracteres" value={senhaCad} onChange={e => setSenhaCad(e.target.value)} />
            </div>
            <div className="modal-campo">
              <label>Confirmar Senha</label>
              <input type="password" placeholder="Repita a senha" value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCadastro(e)} />
            </div>
            {erro    && <p className="modal-erro">{erro}</p>}
            {sucesso && <p className="modal-sucesso">{sucesso}</p>}
            <button className="modal-btn" onClick={handleCadastro} disabled={carregando}>
              {carregando ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </>
        )}

      </div>
    </>
  )
}

export default Login