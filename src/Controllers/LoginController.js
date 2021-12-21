const passwordhash = require('password-hash')
const Restaurants = require('../Models/Restaurants')
const jwt = require('jsonwebtoken')
require('dotenv/config')

exports.login = async (req, res) => {
  const { email, senha } = req.body

  Restaurants.findOne({ email: email }, (err, doc) => {
    if (err) {
      return res.status(400).json({ error: true, message: err.message })
    }

    if (doc && passwordhash.verify(senha, doc.senha)) {
      const token = jwt.sign({ restaurante_id: doc._id }, process.env.SECRET, {
        expiresIn: '1d'
      })
      return res.status(202).json({
        error: false,
        message: 'Login realizado com sucesso',
        token
      })
    }

    return res
      .status(400)
      .json({ error: true, message: 'Email ou senha inválidos' })
  }).exec(err => {
    console.log(err)
  })
}

exports.signup = async (req, res) => {
  const { senha } = req.body

  const passwordHash = passwordhash.generate(senha)

  req.body.senha = passwordHash
  Restaurants.create({ ...req.body }, err => {
    if (err) {
      return res
        .status(400)
        .json({ error: true, message: 'Erro ao cadastrar restaurante' })
    }

    return res
      .status(201)
      .json({ error: false, message: 'Restaurante cadastrado!' })
  })
}

exports.index = async (req, res) => {
  await Restaurants.find({}, (err, doc) => {
    if (err) {
      return res.status(400).json({ error: true, message: err.message })
    }

    return res.status(200).json({ error: false, restaurantes: doc })
  })
    .clone()
    .catch(err => {
      console.log(err)
    })
}
