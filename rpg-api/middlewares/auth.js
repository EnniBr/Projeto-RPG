const jwt = require('jsonwebtoken')

function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ mensagem: 'Token não fornecido' })
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)

        req.usuario = payload

        next()
    } catch (erro) {
        return res.status(401).json({ mensagem: 'Token inválido ou expirado' })
    }
}

function verificarMestre(req, res, next) {
    if (req.usuario.tipo?.toLowerCase() !== 'mestre') {
        return res.status(403).json({ mensagem: 'Acesso restrito ao mestre' })
    }
    next()
}

module.exports = { verificarToken, verificarMestre }