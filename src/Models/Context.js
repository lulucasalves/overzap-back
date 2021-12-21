const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Context = Schema({
  tipo: {
    type: String,
    required: true,
    enum: ['welcome', 'initial', 'finish', 'address', 'cancel'],
    default: 'welcome'
  },
  clienteId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'clients'
  }
})

module.exports = mongoose.model('context', Context)
