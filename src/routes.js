const router = require('express').Router()

const LoginController = require('./Controllers/LoginController')

router.post('/signup', LoginController.signup)

module.exports = router
