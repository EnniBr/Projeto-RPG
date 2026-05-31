const { TransactionalEmailsApi, SendSmtpEmail, ApiClient } = require('@getbrevo/brevo')

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const apiInstance = new TransactionalEmailsApi()
apiInstance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY

const REMETENTE = {
  name:  'RPG System',
  email: process.env.EMAIL_REMETENTE || 'rpgsystemmm.noreply@gmail.com',
}

async function enviarEmailVerificacao(email, nome, token) {
  try {
    const msg = new SendSmtpEmail()
    msg.sender      = REMETENTE
    msg.to          = [{ email, name: nome }]
    msg.subject     = 'Confirme seu email — RPG System'
    msg.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: white; padding: 40px; border-radius: 8px;">
        <h1 style="color: #cc3333;">RPG System</h1>
        <h2 style="font-weight: normal;">Confirme seu email</h2>
        <p style="color: #aaa;">Olá, <strong style="color: white;">${nome}</strong>!</p>
        <p style="color: #aaa;">Clique no botão abaixo para ativar sua conta:</p>
        <a href="${FRONTEND_URL}/verificar-email?token=${token}"
          style="display:inline-block;margin:24px 0;padding:14px 32px;background:#8b0000;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
          Confirmar Email
        </a>
        <p style="color:#555;font-size:0.85rem;">O link expira em 24 horas.</p>
      </div>
    `
    await apiInstance.sendTransacEmail(msg)
    console.log(`Email de verificação enviado para ${email}`)
  } catch (e) {
    console.error('Erro ao enviar email de verificação:', e.message)
  }
}

async function enviarEmailResetSenha(email, nome, token) {
  try {
    const msg = new SendSmtpEmail()
    msg.sender      = REMETENTE
    msg.to          = [{ email, name: nome }]
    msg.subject     = 'Recuperar senha — RPG System'
    msg.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: white; padding: 40px; border-radius: 8px;">
        <h1 style="color: #cc3333;">RPG System</h1>
        <h2 style="font-weight: normal;">Recuperar Senha</h2>
        <p style="color: #aaa;">Olá, <strong style="color: white;">${nome}</strong>!</p>
        <p style="color: #aaa;">Clique para redefinir sua senha:</p>
        <a href="${FRONTEND_URL}/nova-senha?token=${token}"
          style="display:inline-block;margin:24px 0;padding:14px 32px;background:#8b0000;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
          Redefinir Senha
        </a>
        <p style="color:#555;font-size:0.85rem;">O link expira em 1 hora.</p>
      </div>
    `
    await apiInstance.sendTransacEmail(msg)
    console.log(`Email de reset enviado para ${email}`)
  } catch (e) {
    console.error('Erro ao enviar email de reset:', e.message)
  }
}

module.exports = { enviarEmailVerificacao, enviarEmailResetSenha }