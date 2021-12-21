require('dotenv/config')
const fs = require('fs')
const { Client } = require('whatsapp-web.js')
const Clients = require('./Models/Clients')
const Context = require('./Models/Context')
const Restaurants = require('./Models/Restaurants')
const qrcode = require('qrcode-terminal')

const sessionPath = process.env.SESSION_PATH
let sessionConfig

if (fs.existsSync(sessionPath)) {
  sessionConfig = sessionPath
}

const client = new Client({
  session: sessionConfig
})

client.on('qr', qr => {
  qrcode.generate(qr, { small: true })
  console.log('conectado')
})

client.on('authenticated', session => {
  sessionConfig = session
  fs.writeFile(sessionPath, JSON.stringify(session), err => {
    if (err) {
      console.error('falha ao gravar o token')
    }
  })
})

client.on('auth_failure', session => {
  sessionConfig = ''
  fs.writeFile(sessionPath, JSON.stringify(session), err => {
    if (err) {
      console.error('falha ao gravar o token')
    }
  })
})

client.on('ready', () => {
  console.log('Client is ready!')
})

//Função para pegar mensagem e telefone
client.on('message', message => {
  let [phone, type] = message.from.split('@')
  phone = phone.substring(2)

  if (type == 'c.us') {
    clientMessage(phone, message)
  }
})

client.initialize()

const sendMessages = async (number, text) => {
  const phone = `55${number}@c.us`
  const message = text || 'Algo deu errado com a mensagem'
  try {
    client.sendMessage(phone, message)
    console.log(phone, message)
  } catch (err) {
    console.log(err)
    console.log('deu ruim')
  }
}

const clientMessage = async (phone, message) => {
  //formatação
  try {
    let [restauranteTelefone] = message.to.split('@')
    let [clienteTelefone] = message.from.split('@')
    restauranteTelefone = restauranteTelefone.substring(2)
    clienteTelefone = clienteTelefone.substring(2)

    //Procura restaurante e cliente
    const restaurante = await Restaurants.findOne({
      telefone: restauranteTelefone
    })

    if (restaurante) {
      console.log(restaurante)
    } else {
      console.log('não existe')
    }

    const cliente = await Clients.findOne({
      telefone: clienteTelefone,
      restauranteId: restaurante._id
    })

    //Se não tiver cliente ele salva suas infos
    if (!cliente) {
      const contato = await message.getContact()
      cliente = await Clients.create({
        nome: contato.pushname || contato.verifiedName,
        telefone: clienteTelefone,
        restauranteId: restaurante._id
      })
    }

    let context = await Context.findOne({ clienteId: cliente._id })

    console.log(
      'Cliente: ====================================================' +
        cliente._id
    )

    if (!context) {
      context = await Context.create({
        tipo: 'welcome',
        clienteId: cliente._id
      })
    }

    if (message.location) {
      await Clients.findOneAndUpdate(
        cliente._id,
        {
          endereco: {
            coordinates: [message.location.latitude, message.location.longitude]
          }
        },
        { new: true }
      )
      await Context.findOneAndUpdate(
        cliente._id,
        { tipo: 'address' },
        { new: true }
      )
    } else {
      let text = message.body.normalize('NFD').toLowerCase()

      switch (text) {
        case 'sim':
          sendMessages(cliente.telefone, 'Sim')
          console.log(cliente.telefone)
          break
        case 'não':
          sendMessages(cliente.telefone, 'Não')
          break
        case 'pedido':
          sendMessages(cliente.telefone, 'Pedido')
          break
        case 'cancelar':
          console.log('cancelas')
          break
        case 'instrucoes':
          console.log('instrucoes')
          break

        default:
          console.log('default')
          break
      }
    }
  } catch (err) {
    console.error(err)
  }
}
