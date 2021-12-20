require('dotenv/config')
const fs = require('fs')
const { Client } = require('whatsapp-web.js')

const sessionPath = process.env.SESSION_PATH
let sessionConfig

if (fs.existsSync(sessionPath)) {
  sessionConfig = sessionPath
}

const client = new Client({
  session: sessionConfig
})

client.on('authenticated', session => {
  console.log(session)
})

client.on('ready', () => {
  console.log('Client is ready!')
})

client.initialize()
