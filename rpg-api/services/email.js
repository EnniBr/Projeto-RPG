const nodemailer = require('nodemailer')

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

async function enviarEmailVerificacao(email, nome, token) {
  try {
    await transporter.sendMail({
      from:    `"RPG System" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: 'Confirme seu email — RPG System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: white; padding: 40px; border-radius: 8px;">
          <h1 style="color: #cc3333; font-size: 1.8rem; margin-bottom: 8px;">RPG System</h1>
          <h2 style="color: white; font-weight: normal; margin-bottom: 24px;">Confirme seu email</h2>
          <p style="color: #aaa; line-height: 1.6;">Olá, <strong style="color: white;">${nome}</strong>!</p>
          <p style="color: #aaa; line-height: 1.6;">Clique no botão abaixo para confirmar seu email e ativar sua conta:</p>
          <a href="${FRONTEND_URL}/verificar-email?token=${token}"
            style="display: inline-block; margin: 24px 0; padding: 14px 32px; background-color: #8b0000; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 1rem;">
            Confirmar Email
          </a>
          <p style="color: #555; font-size: 0.85rem;">Se você não criou uma conta, ignore este email.</p>
          <p style="color: #555; font-size: 0.85rem;">O link expira em 24 horas.</p>
        </div>
      `,
    })
    console.log(`Email de verificação enviado para ${email}`)
  } catch (e) {
    console.error('Erro ao enviar email de verificação:', e.message)
  }
}

async function enviarEmailResetSenha(email, nome, token) {
  try {
    await transporter.sendMail({
      from:    `"RPG System" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: 'Recuperar senha — RPG System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: white; padding: 40px; border-radius: 8px;">
          <h1 style="color: #cc3333; font-size: 1.8rem; margin-bottom: 8px;">RPG System</h1>
          <h2 style="color: white; font-weight: normal; margin-bottom: 24px;">Recuperar Senha</h2>
          <p style="color: #aaa; line-height: 1.6;">Olá, <strong style="color: white;">${nome}</strong>!</p>
          <p style="color: #aaa; line-height: 1.6;">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo:</p>
          <a href="${FRONTEND_URL}/nova-senha?token=${token}"
            style="display: inline-block; margin: 24px 0; padding: 14px 32px; background-color: #8b0000; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 1rem;">
            Redefinir Senha
          </a>
          <p style="color: #555; font-size: 0.85rem;">Se você não solicitou a recuperação de senha, ignore este email.</p>
          <p style="color: #555; font-size: 0.85rem;">O link expira em 1 hora.</p>
        </div>
      `,
    })
    console.log(`Email de reset enviado para ${email}`)
  } catch (e) {
    console.error('Erro ao enviar email de reset:', e.message)
  }
}

module.exports = { enviarEmailVerificacao, enviarEmailResetSenha }