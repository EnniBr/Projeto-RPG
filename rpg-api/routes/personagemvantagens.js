const express = require('express')
const router = express.Router({ mergeParams: true })

const controller = require('../controllers/personagemVantagemController')
const { verificarToken, verificarMestre } = require('../middlewares/auth')

router.get('/', verificarToken, controller.listarVantagens)
router.post('/', verificarToken, controller.criarVantagem)
router.put('/:id', verificarToken, controller.atualizarVantagem)
router.delete('/:id', verificarToken, verificarMestre, controller.deletarVantagem)

module.exports = router