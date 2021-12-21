const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Restaurants = require('./Restaurants')
const Clients = require('./Clients')

const Order = new Schema({
  restauranteId: {
    type: mongoose.Types.ObjectId,
    ref: 'restaurants',
    required: true
  },
  clienteId: {
    type: mongoose.Types.ObjectId,
    ref: 'clients',
    required: true
  },
  situacao: {
    type: String,
    enum: ['A', 'F', 'P', 'S', 'E', 'C'], // Aberto, Fila, Preparando, Saída, Entregue e Cancelado
    default: 'A'
  },
  data: {
    type: Date,
    default: Date.now
  }
})

// Middleware para restaurante
Order.post('validate', (doc, next) => {
  Restaurants.findById(doc.restauranteId, (err, restaurante) => {
    if (!err && restaurante) {
      next()
    } else {
      next(new Error('Restaurante não existe'))
    }
  })
})

// Middleware para cliente
Order.post('validate', (doc, next) => {
  Clients.findById(doc.clienteId, (err, cliente) => {
    if (
      !err &&
      cliente &&
      doc.restauranteId.toString() == cliente.restauranteId.toString()
    ) {
      next()
    } else {
      next(new Error('Cliente não existe'))
    }
  })
})

module.exports = mongoose.model('order', Order)
