const express = require('express')
const router = express.Router()
const { exportarCSV } = require('../controllers/exportarController')
const { verificarToken } = require('../middlewares/auth')

router.get('/:id/exportar', exportarCSV)

module.exports = router