const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Context = Schema({
  tipo: {
    type: String,
    enum: ['welcome', 'initial', 'finish', 'address', 'cancel'],
    required: true
  },
  clienteId: {
    type: mongoose.Types.ObjectId,
    ref: 'Clients',
    required: true
  }
})

module.exports = mongoose.model('context', Context)
