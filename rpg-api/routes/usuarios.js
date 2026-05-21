const express = require('express')
const router = express.Router()

const usuariosController = require('../controllers/usuariosController')

const { verificarToken, verificarMestre } = require('../middlewares/auth')

router.get('/', verificarToken, verificarMestre, usuariosController.listarUsuarios)
router.post('/', usuariosController.criarUsuarios)
router.put('/:id', verificarToken, usuariosController.atualizarUsuarios)
router.delete('/:id', verificarToken, verificarMestre, usuariosController.deletarUsuarios)

module.exports = router