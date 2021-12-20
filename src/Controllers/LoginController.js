const passwordhash = require('password-hash')
const Restaurant = require('../Models/restaurant')

exports.signup = async (req, res) => {
  const { senha } = req.body

  const passwordHash = passwordhash.generate(senha)

  req.body.senha = passwordHash
  Restaurant.create({ ...req.body }, err => {
    if (err) {
      res
        .status(400)
        .json({ error: true, message: 'Erro ao cadastrar restaurante' })
    }

    res.status(200).json({ error: false, message: 'Restaurante cadastrado!' })
  })
}
