require('dotenv/config')

const mongoose = require('mongoose')

class Connection {
  constructor() {
    this.dataBaseConnectionMongoDB()
  }

  dataBaseConnectionMongoDB() {
    this.mongoDBConnection = mongoose
      .connect(process.env.MONGO_CONNECTION, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
      .then(() => {
        console.log('Conexão estabelicida com o MongoDB')
      })
      .catch(error => {
        console.error(`Erro ao estabelecer conexão com mongoDB: ${error}`)
      })
  }
}

module.exports = new Connection()
