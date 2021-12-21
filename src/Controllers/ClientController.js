const Clients = require('../Models/Clients')

exports.index = async (req, res) => {
  const { restaurante_id: id } = req.headers

  await Clients.find({ restauranteId: id }, (err, doc) => {
    if (err) {
      return res.status(400).json({ error: true, message: err })
    }

    return res.status(200).json({ error: false, categorias: doc })
  })
}

exports.store = async (req, res) => {
  const { restaurante_id: id } = req.headers

  let doc = { ...req.body }
  doc.restauranteId = id

  await Clients.create(doc, err => {
    if (err) {
      return res.status(400).json({ error: true, message: err.message })
    }

    return res
      .status(201)
      .json({ error: false, message: 'Categoria cadastrada com sucesso' })
  })
}

exports.edit = async (req, res) => {
  const { restaurante_id: id } = req.headers
  const { client_id } = req.params

  await Clients.findOneAndUpdate(
    {
      _id: client_id,
      restauranteId: id
    }, //Condição
    { ...req.body }, //Dados
    { new: true, runValidators: true }, //Config

    (err, doc) => {
      if (err) {
        return res.status(400).json({ error: true, message: err })
      }

      return res.status(200).json({ error: false, categorias: doc })
    }
  )
}

exports.delete = async (req, res) => {
  const { restaurante_id: id } = req.headers
  const { client_id } = req.params

  await Clients.findOneAndDelete(
    {
      _id: client_id,
      restauranteId: id
    }, //Condição

    err => {
      if (err) {
        return res.status(400).json({ error: true, message: err })
      }

      return res
        .status(200)
        .json({ error: false, message: 'Categoria apagada com sucesso' })
    }
  )
}
