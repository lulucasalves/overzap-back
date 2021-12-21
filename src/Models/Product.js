const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Category = require('./Category')
const Restaurants = require('./Restaurants')

const Product = new Schema({
  nome: {
    type: String,
    required: true
  },
  descricao: String,
  categoriaId: {
    type: mongoose.Types.ObjectId,
    ref: 'category'
  },
  valor: {
    type: Number,
    required: true
  },
  situacao: {
    type: String,
    enum: ['A', 'I', 'E'], // Ativo, Inativo e Excluído
    default: 'A'
  },
  restauranteId: {
    type: mongoose.Types.ObjectId,
    ref: 'restaurants',
    required: true
  }
})

// Validation para restaurante
Product.post('validate', (doc, next) => {
  Restaurants.findById(doc.restauranteId, (err, restaurante) => {
    if (!err && restaurante) {
      next()
    } else {
      next(new Error('Restaurante não existe'))
    }
  })
})

// Validation para categoria
Product.post('validate', (doc, next) => {
  if (doc.categoriaId) {
    Category.findById(doc.categoriaId, (err, categoria) => {
      if (
        !err &&
        categoria &&
        doc.restauranteId.toString() === categoria.restauranteId.toString()
      ) {
        next()
      } else {
        next(new Error('Categoria não existe'))
      }
    })
  } else {
    next()
  }
})

module.exports = mongoose.model('product', Product)
