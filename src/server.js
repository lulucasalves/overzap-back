const express = require('express')
const cors = require('cors')
const router = require('./routes')
require('./Config/mongodb')
require('./whatsapp')

//======================================================//

const app = express()
app.use(express.json())
app.use(cors())
app.use(router)

//==========================================================//

const port = 5000

app.listen(port, () => {
  console.log(`executando na porta ${port}`)
})
