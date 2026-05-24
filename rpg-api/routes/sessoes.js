const express = require('express')
const router = express.Router()

const sessoesController = require('../controllers/sessoesController')
const { verificarToken, verificarMestre } = require('../middlewares/auth')

router.get('/', verificarToken, sessoesController.listarSessoes)
router.get('/:id', verificarToken, sessoesController.buscarSessao) 
router.post('/', verificarToken, sessoesController.criarSessoes) 
router.put('/:id', verificarToken, sessoesController.atualizarSessoes)
router.delete('/:id', verificarToken, sessoesController.deletarSessoes)
router.post('/entrar', verificarToken, sessoesController.entrarPorCodigo)
router.get('/:id/meu-personagem', verificarToken, sessoesController.meuPersonagemNaSessao)
router.get('/:id/personagens', verificarToken, sessoesController.personagensDaSessao)
router.patch('/:id/configuracoes', verificarToken, sessoesController.atualizarConfiguracoesSessao)

module.exports = router