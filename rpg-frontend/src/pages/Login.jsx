import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './Login.css'

function Login({ fecharModal }) {
  const [modo, setModo] = useState('login') // 'login' | 'cadastro'

  // Login
  const [email,      setEmail]      = useState('')
  const [senha,      setSenha]      = useState('')

  // Cadastro
  const [nome,         setNome]         = useState('')
  const [emailCad,     setEmailCad]     = useState('')
  const [senhaCad,     setSenhaCad]     = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [tipo,         setTipo]         = useState('jogador')

  const [erro,       setErro]       = useState('')
  const [sucesso,    setSucesso]    = useState('')
  const [carregando, setCarregando] = useState(false)

  const navigate = useNavigate()

  function trocarModo(novoModo) {
    setModo(novoModo)
    setErro('')
    setSucesso('')
  }

  // ── Login ──────────────────────────────────────────────────────────────

  async function handleLogin(e) {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    try {
      const resposta = await api.post('/auth/login', { email, senha })
      localStorage.setItem('token', resposta.data.token)
      fecharModal()
      navigate('/dashboard')
    } catch {
      setErro('Email ou senha inválidos.')
    } finally {
      setCarregando(false)
    }
  }

  // ── Cadastro ───────────────────────────────────────────────────────────

  async function handleCadastro(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (!nome.trim())        { setErro('Preencha seu nome.');          return }
    if (!emailCad.trim())    { setErro('Preencha seu email.');         return }
    if (senhaCad.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (senhaCad !== confirmarSenha) { setErro('As senhas não coincidem.'); return }

    setCarregando(true)
    try {
      await api.post('/usuarios', {
        nome:  nome.trim(),
        email: emailCad.trim(),
        senha: senhaCad,
        tipo,
      })
      setSucesso('Conta criada com sucesso! Faça login para continuar.')
      setNome(''); setEmailCad(''); setSenhaCad(''); setConfirmarSenha('')
      setTimeout(() => trocarModo('login'), 2000)
    } catch (err) {
      const msg = err.response?.data?.mensagem
      setErro(msg ?? 'Erro ao criar conta. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      <div className="modal-overlay" onClick={fecharModal} />

      <div className="modal-caixa">
        <button className="modal-fechar" onClick={fecharModal}>✕</button>

        {/* Abas login / cadastro */}
        <div className="modal-abas">
          <button
            className={`modal-aba ${modo === 'login' ? 'modal-aba-ativa' : ''}`}
            onClick={() => trocarModo('login')}
          >
            Entrar
          </button>
          <button
            className={`modal-aba ${modo === 'cadastro' ? 'modal-aba-ativa' : ''}`}
            onClick={() => trocarModo('cadastro')}
          >
            Cadastrar
          </button>
        </div>

        {/* ── MODO LOGIN ── */}
        {modo === 'login' && (
          <>
            <h2 className="modal-titulo">Entrar no Sistema</h2>
            <p className="modal-subtitulo">Acesse sua conta para continuar</p>

            <div className="modal-campo">
              <label>Email</label>
              <input type="email" placeholder="seu@email.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="modal-campo">
              <label>Senha</label>
              <input type="password" placeholder="••••••••"
                value={senha} onChange={e => setSenha(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin(e)} />
            </div>

            {erro && <p className="modal-erro">{erro}</p>}

            <button className="modal-btn" onClick={handleLogin} disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>

            <p className="modal-link-alterar">
              Não tem conta?{' '}
              <span onClick={() => trocarModo('cadastro')}>Cadastre-se</span>
            </p>
          </>
        )}

        {/* ── MODO CADASTRO ── */}
        {modo === 'cadastro' && (
          <>
            <h2 className="modal-titulo">Criar Conta</h2>
            <p className="modal-subtitulo">Preencha os dados para se cadastrar</p>

            <div className="modal-campo">
              <label>Nome</label>
              <input type="text" placeholder="Seu nome"
                value={nome} onChange={e => setNome(e.target.value)} />
            </div>

            <div className="modal-campo">
              <label>Email</label>
              <input type="email" placeholder="seu@email.com"
                value={emailCad} onChange={e => setEmailCad(e.target.value)} />
            </div>

            <div className="modal-campo">
              <label>Senha</label>
              <input type="password" placeholder="Mínimo 6 caracteres"
                value={senhaCad} onChange={e => setSenhaCad(e.target.value)} />
            </div>

            <div className="modal-campo">
              <label>Confirmar Senha</label>
              <input type="password" placeholder="Repita a senha"
                value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCadastro(e)} />
            </div>

            {/* Tipo de conta */}
            <div className="modal-campo">
              <label>Tipo de conta</label>
              <div className="modal-tipo-grupo">
                <button
                  className={`modal-tipo-btn ${tipo === 'jogador' ? 'modal-tipo-ativo' : ''}`}
                  onClick={() => setTipo('jogador')}
                  type="button"
                >
                  🦸 Jogador
                </button>
                <button
                  className={`modal-tipo-btn ${tipo === 'mestre' ? 'modal-tipo-ativo' : ''}`}
                  onClick={() => setTipo('mestre')}
                  type="button"
                >
                  👑 Mestre
                </button>
              </div>
            </div>

            {erro    && <p className="modal-erro">{erro}</p>}
            {sucesso && <p className="modal-sucesso">{sucesso}</p>}

            <button className="modal-btn" onClick={handleCadastro} disabled={carregando}>
              {carregando ? 'Criando conta...' : 'Criar Conta'}
            </button>

            <p className="modal-link-alterar">
              Já tem conta?{' '}
              <span onClick={() => trocarModo('login')}>Faça login</span>
            </p>
          </>
        )}
      </div>
    </>
  )
}

export default Login