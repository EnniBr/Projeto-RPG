const express    = require('express')
const router     = express.Router()
const passport   = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy

const authController = require('../controllers/authController')

// ─── Configurar Google Strategy ────────────────────────────────────────────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  `${process.env.BASE_URL || 'http://localhost:3000'}/auth/google/callback`,
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile)
}))

// ─── Rotas ─────────────────────────────────────────────────────────────────

// Login e cadastro
router.post('/login',    authController.login)
router.post('/cadastrar', authController.cadastrar)

// Verificação de email
router.get('/verificar-email',      authController.verificarEmail)
router.post('/reenviar-verificacao', authController.reenviarVerificacao)

// Reset de senha
router.post('/solicitar-reset', authController.solicitarResetSenha)
router.post('/redefinir-senha', authController.redefinirSenha)

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
)

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?erro=google` }),
  authController.googleCallback
)

module.exports = router