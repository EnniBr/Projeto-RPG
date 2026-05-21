const express = require('express')
const router = express.Router()

const poderesController = require('../controllers/poderesController')
const { verificarToken, verificarMestre } = require('../middlewares/auth')

router.get('/', verificarToken, poderesController.listarPoderes)
router.post('/', verificarToken, verificarMestre, poderesController.criarPoderes)
router.put('/:id', verificarToken, verificarMestre, poderesController.atualizarPoderes)
router.delete('/:id', verificarToken, verificarMestre, poderesController.deletarPoderes)

module.exports = router