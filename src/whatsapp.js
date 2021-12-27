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

  Digite a opção desejada:
  - Cardápio
  - Instruções
  - Pedido
  - Cancelar
  - Finalizar

  Para cadastrar seu endereço, basta enviar sua localização atual.
  `

  sendMessages(client.telefone, message)
}

const orderMessage = async (client, context) => {
  await Context.findByIdAndUpdate(context._id, { tipo: 'initial' })

  let order = await Order.findOne({ clienteId: client._id, situacao: 'A' })

  if (order) {
    const orderItems = await OrderProduct.find({
      pedidoId: order._id
    }).populate('produtoId')

    let message = ``

    if (orderItems.length) {
      let payTotal = 0.0
      orderItems.forEach((item, index) => {
        payTotal += item.valorUnitario * item.quantidade
        message += `${item.quantidade} x ${item.produtoId.nome}\n`
      })

      let payFormated = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(parseFloat(payTotal))

      message += `\nTotal: ${payFormated}`

      sendMessages(client.telefone, message)
    } else {
      sendMessages(client.telefone, 'Não há nenhum produto no seu pedido')
    }
  } else {
    sendMessages(
      client.telefone,
      `Não há pedidos abertos no nome de ${client.nome}`
    )
  }
}

const menuMessage = async (client, context) => {
  await Context.findByIdAndUpdate(context._id, { tipo: 'initial' })

  const menu = await Product.find({
    restauranteId: client.restauranteId,
    situacao: 'A'
  }).sort('categoriaId')

  let message = ''

  menu.forEach((item, index) => {
    let totalValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(item.valor)

    message += `${index + 1}. ${item.nome} - ${totalValue}\n`
    message += item.descricao ? ` ${item.descricao}\n` : '\n'
  })

  message += `Para adicionar um item ao carrinho, basta informar o seu número!\n \nSe você quiser adicionar o mesmo produto, basta informar o número do produto e sua quantidade\n \nEx: 1x3 = 3 itens do produto número 1`

  sendMessages(client.telefone, message)
}

const cancelMessage = async (client, context) => {
  let order = await Order.find({ clienteId: client._id, situacao: 'A' })

  if (order) {
    await Context.findByIdAndUpdate(context._id, { tipo: 'cancel' })

    sendMessages(
      client.telefone,
      `Tem certeza que deseja cancelar o pedido? (sim) ou (não)`
    )
  } else {
    sendMessages(
      client.telefone,
      `Não há pedidos abertos no nome de ${client.nome}`
    )
  }
}

const denyMessage = async (client, context) => {
  await Context.findByIdAndUpdate(context._id, { tipo: 'initial' })

  switch (context.tipo) {
    case 'cancel':
      sendMessages(
        client.telefone,
        'Ok, digite *finalizar* para finalizar seu pedido, ou adicione um novo item!'
      )
      break

    default:
      notUnderstandMessage(client)
      break
  }
}

const confirmMessage = async (client, context) => {
  switch (context.tipo) {
    case 'cancel':
      let pedido = await Order.findOneAndUpdate(
        {
          clienteId: client._id,
          situacao: 'A'
        },
        { situacao: 'C' }
      )
      await Context.findByIdAndUpdate(context._id, { tipo: 'initial' })

      if (pedido) {
        sendMessages(client.telefone, 'Seu pedido foi cancelado com sucesso!')
      } else {
        sendMessages(
          client.telefone,
          `Não há pedidos abertos no nome de ${client.nome}`
        )
      }
      break

    default:
      notUnderstandMessage(client)
      break
  }
}

const finishMessage = async (client, context) => {
  let order = await Order.findOne({
    clienteId: client._id,
    situacao: 'A'
  }).populate('restauranteId')

  const [latitude, longitude] = client.endereco.coordenadas
  const numero = client.endereco.numero

  if (order) {
    if (latitude && longitude && numero) {
      await Order.findOneAndUpdate(
        {
          clienteId: client._id,
          situacao: 'A'
        },
        { situacao: 'F' }
      )
      await Context.findByIdAndUpdate(context._id, { tipo: 'initial' })
      sendMessages(client.telefone, `Seu pedido foi finalizado com sucesso!`)
      sendMessages(
        client.telefone,
        `Nós da ${order.restauranteId.nome} agradecemos a preferência`
      )
    } else {
      sendMessages(
        client.telefone,
        'Para finalizar seu pedido, por favor nos envie sua localização atual e digite *Finalizar* novamente'
      )
    }
  } else {
    sendMessages(
      client.telefone,
      `Não há pedidos abertos no nome de ${client.nome}`
    )
  }
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

        try {
          const setMenu = await Product.find({
            restauranteId: client.restauranteId,
            situacao: 'A'
          }).sort('categoriaId')

          const newProduct = setMenu[parseInt(product) - 1]

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
        } catch {
          sendMessages(client.telefone, 'Este produto não existe')
        }
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
      // denyMessage(client, context)
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

  let cliente = await Clients.findOne({
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
          coordenadas: [message.location.latitude, message.location.longitude]
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

    sendMessages(
      cliente.telefone,
      'Por favor, informe o número da residência *somente números*'
    )
  } else {
    switch (text) {
      case 'cardapio':
        menuMessage(cliente, context)
        break
      case 'sim':
        confirmMessage(cliente, context)
        break
      case 'nao':
        denyMessage(cliente, context)
        break
      case 'instrucoes':
        welcomeMessage(cliente)
        break
      case 'pedido':
        orderMessage(cliente, context)
        break
      case 'cancelar':
        cancelMessage(cliente, context)
        break
      case 'finalizar':
        finishMessage(cliente, context)
        break

      default:
        defaultMessage(cliente, context, text)
        break
    }
  }
}
