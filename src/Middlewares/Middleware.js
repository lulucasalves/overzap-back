const jwt = require('jsonwebtoken')
require('dotenv/config')

function authenticate(req, res, next) {
  try {
    const [, token] = req.headers.authorization.split(' ')

    const { restaurante_id } = jwt.verify(token, process.env.SECRET)
    req.headers.restaurante_id = restaurante_id

    next()
  } catch (err) {
    return res.status(103).json({ error: true, message: 'Token inválido', err })
  }
}

module.exports = { authenticate }
