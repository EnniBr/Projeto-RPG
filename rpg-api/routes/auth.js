const express    = require('express')
const router     = express.Router()
const passport   = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const authController = require('../controllers/authController')

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  `${process.env.BASE_URL || 'http://localhost:3000'}/auth/google/callback`,
}, (accessToken, refreshToken, profile, done) => done(null, profile)))

router.post('/login',    authController.login)
router.post('/cadastrar', authController.cadastrar)

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
)
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/?erro=google` }),
  authController.googleCallback
)

module.exports = router