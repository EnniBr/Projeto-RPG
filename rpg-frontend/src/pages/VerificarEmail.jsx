import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

function VerificarEmail() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const token          = searchParams.get('token')

  const [status,   setStatus]   = useState('verificando') // 'verificando' | 'ok' | 'erro'
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    async function verificar() {
      if (!token) { setStatus('erro'); setMensagem('Token não encontrado.'); return }
      try {
        const resp = await api.get(`/auth/verificar-email?token=${token}`)
        setMensagem(resp.data.mensagem)
        setStatus('ok')
        setTimeout(() => navigate('/'), 3000)
      } catch (err) {
        setMensagem(err.response?.data?.mensagem ?? 'Token inválido ou expirado.')
        setStatus('erro')
      }
    }
    verificar()
  }, [token])

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Crimson Pro, serif',
    }}>
      <div style={{
        backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: 12, padding: '48px 40px', width: 420,
        textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>
        {status === 'verificando' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⏳</div>
            <h2 style={{ color: 'white', margin: '0 0 8px' }}>Verificando email...</h2>
            <p style={{ color: '#666' }}>Aguarde um momento.</p>
          </>
        )}
        {status === 'ok' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#2ecc71', margin: '0 0 8px' }}>Email verificado!</h2>
            <p style={{ color: '#aaa' }}>{mensagem}</p>
            <p style={{ color: '#555', fontSize: '0.85rem', marginTop: 12 }}>
              Redirecionando em 3 segundos...
            </p>
          </>
        )}
        {status === 'erro' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>❌</div>
            <h2 style={{ color: '#e74c3c', margin: '0 0 8px' }}>Ops!</h2>
            <p style={{ color: '#aaa' }}>{mensagem}</p>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: 20, padding: '10px 24px',
                backgroundColor: '#8b0000', color: 'white',
                border: 'none', borderRadius: 6, cursor: 'pointer',
                fontSize: '0.95rem', fontWeight: 'bold',
              }}
            >
              Voltar ao início
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default VerificarEmail
