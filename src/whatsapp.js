require('dotenv/config')
const fs = require('fs')
const { Client } = require('whatsapp-web.js')
const Clients = require('./Models/Clients')
const Context = require('./Models/Context')
const Restaurants = require('./Models/Restaurants')
const Product = require('./Models/Product')
const Order = require('./Models/Order')
const OrderProduct = require('./Models/OrderProduct')
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
      console.error(err)
    }
  })
})

client.on('auth_failure', session => {
  sessionConfig = ''
  fs.writeFile(sessionPath, JSON.stringify(session), err => {
    if (err) {
      console.error(err)
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
  }
}

const welcomeMessage = async client => {
  const restaurant = await Restaurants.findById(client.restauranteId)

  let message = `Olá, eu sou o bot de atendimento do ${restaurant.nome} e estou aqui para lhe ajudar!

  \nDigite a opção desejada:
  - Cardápio
  - Instruções
  - Pedido
  - Cancelar
  - Finalizar

  \nPara cadastrar seu endereço, basta enviar sua localização atual.
  `

  sendMessages(client.telefone, message)
}

/*const orderMessage = async (client, context) => {
  await Context.findByIdAndUpdate(context._id, { tipo: 'initial' })

  let order = await Order.find({ clienteId: client._id, situacao: 'A' })
}*/

const menuMessage = async (client, context) => {
  await Context.findByIdAndUpdate(context._id, { tipo: 'initial' })

  const menu = await Product.find({
    restauranteId: client.restauranteId,
    situacao: 'A'
  }).sort('categoriaId')

  let message = ''
  menu.forEach((item, index) => {
    message += `${index + 1}. ${item.nome} - R$${item.valor}\n`
    message += item.descricao ? ` ${item.descricao}\n` : '\n'
  })

  message += `\nPara adicionar um item ao carrinho, basta informar o seu número!\n \nSe você quiser adicionar o mesmo produto, basta informar o número do produto e sua quantidade \nEx: 1x3 = 3 itens do produto número 1`

  sendMessages(client.telefone, message)
}
const defaultMessage = async (client, context, text) => {
  switch (context.tipo) {
    case 'welcome':
      await Context.findByIdAndUpdate(context._id, { tipo: 'initial' })
      welcomeMessage(client)
      break
    case 'initial':
      if (text.indexOf('x') > -1) {
        const [product, quantity] = text.split('x')

        const setMenu = await Product.find({
          restauranteId: client.restauranteId,
          situacao: 'A'
        }).sort('categoriaId')
        console.log(setMenu)

        const newProduct = setMenu[parseInt(product) - 1]
        console.log(newProduct)

        let order = await Order.findOne({
          clienteId: client._id,
          situacao: 'A'
        })

        if (!order) {
          order = await Order.create({
            clienteId: client._id,
            restauranteId: client.restauranteId
          })
        }

        await OrderProduct.create({
          pedidoId: order._id,
          produtoId: newProduct._id,
          valorUnitario: newProduct.valor,
          quantidade: parseInt(quantity)
        })

        sendMessages(
          client.telefone,
          `${quantity} ${newProduct.nome}s foram adicionados ao carrinho`
        )
      } else if (!isNaN(text)) {
        const setMenu = await Product.find({
          restauranteId: client.restauranteId,
          situacao: 'A'
        }).sort('categoriaId')

        let quantity = 1

        try {
          let product = setMenu[parseInt(text) - 1]

          let order = await Order.findOne({
            clienteId: client._id,
            situacao: 'A'
          })

          if (!order) {
            order = await Order.create({
              clienteId: client._id,
              restauranteId: client.restauranteId
            })
          }

          await OrderProduct.create({
            pedidoId: order._id,
            produtoId: product._id,
            valorUnitario: product.valor,
            quantidade: quantity
          })

          sendMessages(
            client.telefone,
            `${product.nome} foi adicionado ao carrinho`
          )
        } catch {
          sendMessages(client.telefone, 'Este produto não existe')
        }
      } else {
        notUnderstandMessage(client)
      }

      break
    case 'finish':
      welcomeMessage(client)
      break
    case 'address':
      if (!isNaN(text)) {
        await Context.findByIdAndUpdate(context._id, { tipo: 'initial' })

        await Clients.findByIdAndUpdate(client.id, {
          endereco: { ...client.endereco, numero: text }
        })

        sendMessages(
          client.telefone,
          'Número do endereço atualizado com sucesso!'
        )
      } else {
        sendMessages(
          client.telefone,
          'Número inválido! Por favor tente novamente...'
        )
      }

      break
    case 'cancel':
      welcomeMessage(client)
      break

    default:
      notUnderstandMessage(client)
      break
  }
}

const notUnderstandMessage = client => {
  sendMessages(
    client.telefone,
    'Desculpe, não consegui entender o que você disse. Digite "instruções" para visualizar os comandos'
  )
}

const clientMessage = async (phone, message) => {
  //formatação

  let [restauranteTelefone] = message.to.split('@')
  let [clienteTelefone] = message.from.split('@')

  restauranteTelefone = restauranteTelefone.substring(2)
  clienteTelefone = clienteTelefone.substring(2)

  //Procura restaurante e cliente
  const restaurante = await Restaurants.findOne({
    telefone: restauranteTelefone
  })

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

  if (!context) {
    context = await Context.create({
      tipo: 'welcome',
      clienteId: cliente._id
    })
  }

  let text = message.body.normalize('NFD').toLowerCase()

  if (message.location) {
    cliente = await Clients.findByIdAndUpdate(
      cliente._id,
      {
        endereco: {
          coordinates: [message.location.latitude, message.location.longitude]
        }
      },
      { new: true }
    )
    await Context.findByIdAndUpdate(
      context._id,
      {
        tipo: 'address'
      },
      {
        new: true
      }
    )

    defaultMessage(cliente, context, text)
  } else {
    switch (text) {
      case 'cardapio':
        menuMessage(cliente, context)
        break
      case 'não':
        sendMessages(cliente.telefone, 'Não')
        break
      case 'instrucoes':
        welcomeMessage(cliente)
        break
      case 'pedido':
        orderMessage(cliente, context)
        break
      case 'cancelar':
        // welcomeMessage(cliente)
        break
      case 'finalizar':
        //    welcomeMessage(cliente)
        break

      default:
        defaultMessage(cliente, context, text)
        break
    }
  }
}
