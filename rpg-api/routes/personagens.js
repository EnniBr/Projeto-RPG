const express = require('express')
const router = express.Router()

const personagensController = require('../controllers/personagensController')
const { verificarToken, verificarMestre } = require('../middlewares/auth')

router.get('/', verificarToken, personagensController.listarPersonagens)
router.post('/', verificarToken, personagensController.criarPersonagens)
router.put('/:id', verificarToken, personagensController.atualizarPersonagens)
router.delete('/:id', verificarToken, personagensController.deletarPersonagens)
router.post('/criar-completo', verificarToken, personagensController.criarPersonagemCompleto)
router.patch('/:id/machucados', verificarToken, personagensController.atualizarMachucados)
router.get('/:id/completo', verificarToken, personagensController.buscarPersonagemCompleto)

module.exports = router