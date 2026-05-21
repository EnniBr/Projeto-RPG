const express = require('express')
const router = express.Router()

const sessoesController = require('../controllers/sessoesController')
const { verificarToken, verificarMestre } = require('../middlewares/auth')

router.get('/', verificarToken, sessoesController.listarSessoes)
router.post('/', verificarToken, verificarMestre, sessoesController.criarSessoes)
router.put('/:id', verificarToken, verificarMestre, sessoesController.atualizarSessoes)
router.delete('/:id', verificarToken, verificarMestre, sessoesController.deletarSessoes)
router.post('/entrar', verificarToken, sessoesController.entrarPorCodigo)
router.get('/:id/meu-personagem', verificarToken, sessoesController.meuPersonagemNaSessao)
router.get('/:id/personagens', verificarToken, sessoesController.personagensDaSessao)
router.patch('/:id/configuracoes', verificarToken, sessoesController.atualizarConfiguracoesSessao)

module.exports = router