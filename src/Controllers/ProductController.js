const Product = require('../Models/Product')

exports.index = async (req, res) => {
  Product.find({})
    .populate('categoriaId', '_id nome')
    .exec((err, doc) => {
      if (err) {
        return res.status(400).json({ error: true, message: err })
      }

      return res.status(200).json({ error: false, produtos: doc })
    })
}

exports.store = async (req, res) => {
  const { restaurante_id: id } = req.headers

  let doc = { ...req.body }
  doc.restauranteId = id

  await Product.create(doc, err => {
    if (err) {
      return res.status(400).json({ error: true, message: err.message })
    }

    return res
      .status(201)
      .json({ error: false, message: 'Produto cadastrado com sucesso' })
  })
}

exports.edit = async (req, res) => {
  const { restaurante_id: id } = req.headers
  const { product_id } = req.params

  await Product.findOneAndUpdate(
    {
      _id: product_id,
      restauranteId: id
    }, //Condição
    { ...req.body }, //Dados
    { new: true, runValidators: true }, //Config

    (err, doc) => {
      if (err) {
        return res.status(400).json({ error: true, message: err })
      }

      return res.status(200).json({ error: false, produtos: doc })
    }
  )
}

exports.delete = async (req, res) => {
  const { restaurante_id: id } = req.headers
  const { product_id } = req.params

  await Product.findOneAndDelete(
    {
      _id: product_id,
      restauranteId: id
    }, //Condição

    err => {
      if (err) {
        return res.status(400).json({ error: true, message: err })
      }

      return res
        .status(200)
        .json({ error: false, message: 'Produto apagado com sucesso' })
    }
  )
}

exports.addItem = async (req, res) => {}
