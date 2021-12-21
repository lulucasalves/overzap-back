const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Restaurants = require('./Restaurants')

const Category = new Schema({
  nome: {
    type: String,
    required: true,
    unique: true
  },
  descricao: String,
  restauranteId: {
    type: mongoose.Types.ObjectId,
    ref: 'restaurants',
    required: true
  }
})

//Middleware
Category.post('validate', (doc, next) => {
  Restaurants.findById(doc.restauranteId, (err, restaurante) => {
    if (!err && restaurante) {
      next()
    } else {
      next(new Error('Restaurante não existe'))
    }
  })
})

module.exports = mongoose.model('category', Category)
