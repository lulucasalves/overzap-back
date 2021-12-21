const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Clients = Schema({
  nome: { type: String, required: true },
  telefone: {
    type: String,
    required: true,
    validate: [/^[0-9]{10,11}$/]
  },
  endereco: { coordenadas: [], numero: String },
  created_at: { type: Date, default: Date.now },
  restauranteId: {
    type: mongoose.Types.ObjectId,
    ref: 'Restaurants',
    required: true
  }
})

module.exports = mongoose.model('clients', Clients)
