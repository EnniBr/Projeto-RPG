import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    const erro  = searchParams.get('erro')

    if (token) {
      localStorage.setItem('token', token)
      navigate('/dashboard', { replace: true })
    } else {
      navigate(`/?erro=${erro ?? 'Erro ao autenticar'}`, { replace: true })
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontFamily: 'Crimson Pro, serif',
    }}>
      <p>Autenticando com Google...</p>
    </div>
  )
}

export default AuthCallback
