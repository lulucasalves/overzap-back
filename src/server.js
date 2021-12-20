require('dotenv/config')
const express = require('express')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())

const port = 5000

app.listen(port, () => {
  console.log(`executando a porta ${port}`)
})
