import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

function NovaSenha() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const token          = searchParams.get('token')

  const [novaSenha,   setNovaSenha]   = useState('')
  const [confirmar,   setConfirmar]   = useState('')
  const [carregando,  setCarregando]  = useState(false)
  const [erro,        setErro]        = useState('')
  const [sucesso,     setSucesso]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (novaSenha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return }
    if (novaSenha !== confirmar) { setErro('As senhas não coincidem.'); return }
    setCarregando(true)
    try {
      await api.post('/auth/redefinir-senha', { token, novaSenha })
      setSucesso(true)
      setTimeout(() => navigate('/'), 3000)
    } catch (err) {
      setErro(err.response?.data?.mensagem ?? 'Erro ao redefinir senha.')
    } finally {
      setCarregando(false)
    }
  }

  const inputStyle = {
    padding: '12px 14px', borderRadius: 6, border: '1px solid #333',
    backgroundColor: '#111', color: 'white', fontSize: '0.95rem',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Crimson Pro, serif',
    }}>
      <div style={{
        backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: 12, padding: '48px 40px', width: 420,
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>
        {!sucesso ? (
          <>
            <h2 style={{ color: 'white', margin: '0 0 8px', fontSize: '1.6rem', fontFamily: 'sans-serif' }}>
              Nova Senha
            </h2>
            <p style={{ color: '#888', margin: '0 0 28px', fontSize: '0.9rem' }}>
              Escolha uma nova senha para sua conta.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Nova Senha
                </label>
                <input type="password" placeholder="Mínimo 6 caracteres"
                  value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                  style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Confirmar Senha
                </label>
                <input type="password" placeholder="Repita a senha"
                  value={confirmar} onChange={e => setConfirmar(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
                  style={inputStyle} />
              </div>

              {erro && <p style={{ color: '#e74c3c', fontSize: '0.85rem', margin: 0 }}>{erro}</p>}

              <button onClick={handleSubmit} disabled={carregando}
                style={{
                  padding: 13, backgroundColor: '#8b0000', color: 'white',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                  fontSize: '1rem', fontWeight: 'bold', marginTop: 4,
                  opacity: carregando ? 0.7 : 1,
                }}>
                {carregando ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#2ecc71', margin: '0 0 8px' }}>Senha redefinida!</h2>
            <p style={{ color: '#aaa' }}>Você já pode fazer login com a nova senha.</p>
            <p style={{ color: '#555', fontSize: '0.85rem', marginTop: 12 }}>
              Redirecionando em 3 segundos...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NovaSenha
