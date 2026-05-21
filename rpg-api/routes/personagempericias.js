const express = require('express')
const router = express.Router({ mergeParams: true })

const controller = require('../controllers/personagemPericiaController')
const { verificarToken, verificarMestre } = require('../middlewares/auth')

router.get('/', verificarToken, controller.listarPericias)
router.post('/', verificarToken, controller.criarPericia)
router.put('/:id', verificarToken, controller.atualizarPericia)
router.delete('/:id', verificarToken, verificarMestre, controller.deletarPericia)

module.exports = router