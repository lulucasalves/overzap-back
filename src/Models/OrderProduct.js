const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Order = require('./Order')
const Product = require('./Product')

const OrderProduct = new Schema({
  pedidoId: {
    type: mongoose.Types.ObjectId,
    ref: 'order',
    required: true
  },
  produtoId: {
    type: mongoose.Types.ObjectId,
    ref: 'product',
    required: true
  },
  valorUnitario: {
    type: Number,
    required: true
  },
  quantidade: {
    type: Number,
    default: 1
  },
  observacao: String
})

OrderProduct.post('validate', async (doc, next) => {
  console.log(doc)
  const pedido = await Order.findById(doc.pedidoId)
  const produto = await Product.findById(doc.produtoId)

  if (
    pedido &&
    produto &&
    pedido.restauranteId.toString() == produto.restauranteId.toString()
  ) {
    next()
  } else {
    next(new Error('Produto ou Pedido não encontrado!'))
  }
})

module.exports = mongoose.model('orderProduct', OrderProduct)
