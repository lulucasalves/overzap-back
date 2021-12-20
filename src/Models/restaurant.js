const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Restaurant = Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  telefone: { type: String, required: true, validate: [/^[0-9]{10,11}$/] },
  endereco: { coordenadas: [], numero: String },
  instagram: String,
  facebook: String,
  twitter: String,
  created_at: { type: Date, default: Date.now }
})

module.exports = mongoose.model('restaurants', Restaurant)
