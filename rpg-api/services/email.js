const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const BREVO_API_KEY = process.env.BREVO_API_KEY
const REMETENTE_EMAIL = process.env.EMAIL_REMETENTE || 'rpgsystemmm.noreply@gmail.com'

async function enviarEmail(para, nomePara, assunto, html) {
  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept':       'application/json',
      'api-key':      BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender:      { name: 'RPG System', email: REMETENTE_EMAIL },
      to:          [{ email: para, name: nomePara }],
      subject:     assunto,
      htmlContent: html,
    }),
  })
  if (!resp.ok) {
    const erro = await resp.text()
    throw new Error(`Brevo erro ${resp.status}: ${erro}`)
  }
  console.log(`Email enviado para ${para}`)
}

async function enviarEmailVerificacao(email, nome, token) {
  try {
    await enviarEmail(email, nome, 'Confirme seu email — RPG System', `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;color:white;padding:40px;border-radius:8px;">
        <h1 style="color:#cc3333;">RPG System</h1>
        <h2 style="font-weight:normal;">Confirme seu email</h2>
        <p style="color:#aaa;">Olá, <strong style="color:white;">${nome}</strong>!</p>
        <p style="color:#aaa;">Clique no botão abaixo para ativar sua conta:</p>
        <a href="${FRONTEND_URL}/verificar-email?token=${token}"
          style="display:inline-block;margin:24px 0;padding:14px 32px;background:#8b0000;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
          Confirmar Email
        </a>
        <p style="color:#555;font-size:0.85rem;">O link expira em 24 horas.</p>
      </div>
    `)
  } catch (e) {
    console.error('Erro ao enviar email de verificação:', e.message)
  }
}

async function enviarEmailResetSenha(email, nome, token) {
  try {
    await enviarEmail(email, nome, 'Recuperar senha — RPG System', `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;color:white;padding:40px;border-radius:8px;">
        <h1 style="color:#cc3333;">RPG System</h1>
        <h2 style="font-weight:normal;">Recuperar Senha</h2>
        <p style="color:#aaa;">Olá, <strong style="color:white;">${nome}</strong>!</p>
        <p style="color:#aaa;">Clique para redefinir sua senha:</p>
        <a href="${FRONTEND_URL}/nova-senha?token=${token}"
          style="display:inline-block;margin:24px 0;padding:14px 32px;background:#8b0000;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
          Redefinir Senha
        </a>
        <p style="color:#555;font-size:0.85rem;">O link expira em 1 hora.</p>
      </div>
    `)
  } catch (e) {
    console.error('Erro ao enviar email de reset:', e.message)
  }
}

module.exports = { enviarEmailVerificacao, enviarEmailResetSenha }