const express = require('express')
const router = express.Router()

const atributosController = require('../controllers/atributosController')

const { verificarToken, verificarMestre } = require('../middlewares/auth')

router.get('/', verificarToken, atributosController.listarAtributos)
router.post('/', verificarToken, atributosController.criarAtributos)
router.put('/:id', verificarToken, verificarMestre, atributosController.atualizarAtributos)
router.delete('/:id', verificarToken, verificarMestre, atributosController.deletarAtributos)

module.exports = router