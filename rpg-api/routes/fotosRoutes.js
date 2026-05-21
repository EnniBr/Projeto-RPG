const express  = require('express')
const router   = express.Router()
const multer   = require('multer')
const path     = require('path')
const { PrismaClient } = require('../node_modules/@prisma/client')
const { verificarToken } = require('../middlewares/auth')

const prisma = new PrismaClient()

// ─── Storage: Cloudinary em produção, disco local em dev ───────────────────

let storage
let usandoCloudinary = false

if (process.env.CLOUDINARY_CLOUD_NAME) {
  const cloudinary              = require('cloudinary').v2
  const { CloudinaryStorage }   = require('multer-storage-cloudinary')

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          'rpg-system/personagens',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation:  [{ width: 800, height: 1000, crop: 'limit', quality: 'auto' }],
    },
  })

  usandoCloudinary = true
  console.log('Storage: Cloudinary ativo')
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '..', 'uploads')
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `personagem-${req.params.id}-${Date.now()}${ext}`)
    },
  })
  console.log('Storage: disco local (desenvolvimento)')
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Apenas imagens são permitidas'))
  },
})

// ─── Rota de upload ────────────────────────────────────────────────────────

router.post('/:id/foto', verificarToken, upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ mensagem: 'Nenhum arquivo enviado' })

    const url = usandoCloudinary
      ? req.file.path
      : `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${req.file.filename}`

    await prisma.personagem.update({
      where: { id: Number(req.params.id) },
      data:  { foto: url },
    })

    res.json({ url })
  } catch (erro) {
    console.log('ERRO UPLOAD FOTO:', erro.message)
    res.status(500).json({ mensagem: 'Erro ao salvar foto', erro: erro.message })
  }
})

module.exports = router