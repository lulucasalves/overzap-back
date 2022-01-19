const express = require('express')
const router = express.Router()

const LoginController = require('./Controllers/LoginController')
const CategoryController = require('./Controllers/CategoryController')
const ClientController = require('./Controllers/ClientController')
const OrderController = require('./Controllers/OrderController')
const ProductController = require('./Controllers/ProductController')
const RestaurantController = require('./Controllers/RestaurantController')
const { authenticate } = require('./Middlewares/Middleware')

//LOGIN
router.post('/signup', LoginController.signup)
router.get('/restaurants', LoginController.index)
router.post('/login', LoginController.login)

//CATEGORIAS
router.post('/category', authenticate, CategoryController.store)
router.post('/category/:category_id', authenticate, CategoryController.edit)
router.delete('/category/:category_id', authenticate, CategoryController.delete)
router.get('/categorys', CategoryController.index)

//CLIENTES
router.post('/client', authenticate, ClientController.store)
router.post('/client/:client_id', authenticate, ClientController.edit)
router.delete('/client/:client_id', authenticate, ClientController.delete)
router.get('/clients', ClientController.index)

//PEDIDOS
router.post('/order', authenticate, OrderController.store)
router.post('/order/:order_id', authenticate, OrderController.edit)
router.delete('/order/:order_id', authenticate, OrderController.delete)
router.get('/orders', OrderController.index)
router.post('/order/:order_id/add', authenticate, OrderController.addItem)

//RESTAURANTES
router.post(
  '/restaurant/:restaurant_id',
  authenticate,
  RestaurantController.edit
)

//PRODUTOS
router.post('/product', authenticate, ProductController.store)
router.post('/product/:product_id', authenticate, ProductController.edit)
router.post('/product/:product_id/add', authenticate, ProductController.addItem)
router.delete('/product/:product_id', authenticate, ProductController.delete)
router.get('/products', ProductController.index)

module.exports = router
