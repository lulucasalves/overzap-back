const Restaurants = require('../Models/Restaurants')

exports.edit = async (req, res) => {
  const { restaurante_id: id } = req.headers
  const { restaurant_id } = req.params

  await Restaurants.findOneAndUpdate(
    {
      _id: restaurant_id,
      restauranteId: id
    }, //Condição
    { ...req.body }, //Dados
    { new: true, runValidators: true }, //Config

    (err, doc) => {
      if (err) {
        return res.status(400).json({ error: true, message: err })
      }

      return res.status(200).json({ error: false, restaurantes: doc })
    }
  )
}
