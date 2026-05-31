import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage       from './pages/LandingPage.jsx'
import Login             from './pages/Login.jsx'
import Dashboard         from './pages/Dashboard.jsx'
import PainelMestre      from './pages/PainelMestre.jsx'
import FichaPersonagem   from './pages/FichaPersonagem.jsx'
import CriacaoPersonagem from './pages/CriacaoPersonagem.jsx'
import EditarPersonagem  from './pages/EditarPersonagem.jsx'
import AuthCallback      from './pages/AuthCallback.jsx'
import RotaProtegida     from './components/RotaProtegida.jsx'

function App() {
  const [modalAberto, setModalAberto] = useState(false)

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage abrirLogin={() => setModalAberto(true)} />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
        <Route path="/sessao/:id/mestre" element={<RotaProtegida><PainelMestre /></RotaProtegida>} />
        <Route path="/sessao/:id/ficha" element={<RotaProtegida><FichaPersonagem /></RotaProtegida>} />
        <Route path="/sessao/:id/criar-personagem" element={<RotaProtegida><CriacaoPersonagem /></RotaProtegida>} />
        <Route path="/sessao/:id/editar-personagem/:personagemId" element={<RotaProtegida><EditarPersonagem /></RotaProtegida>} />
      </Routes>
      {modalAberto && <Login fecharModal={() => setModalAberto(false)} />}
    </>
  )
}

export default App