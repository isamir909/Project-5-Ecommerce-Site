const express = require('express');
const router=express.Router();
const userController=require('../controller/userController')
const productController=require('../controller/productController')
const cartController=require('../controller/cartController')
const orderController=require('../controller/orderController')
const {authenticate}=require('../middleware/authentication')
  
//......................User Feature...........................//
router.post('/register',userController.createUser)
router.post('/login',userController.login)
router.get('/user/:userId/profile',authenticate,userController.getUserProfile) //a
router.put('/user/:userId/profile',authenticate,userController.updateData)//a


//......................Product Feature...........................//
router.post('/products',productController.createProduct)
router.get('/products',productController.getProducts)
router.get('/products/:productId',productController.getProductById)
router.put('/products/:productId',productController.updateProduct)
router.delete('/products/:productId',productController.deleteProductById)

//......................Cart Feature...........................//
router.post('/users/:userId/cart',cartController.createCart)  //check a
router.put("/users/:userId/cart",cartController.updateCart)    
router.get('/users/:userId/cart',authenticate,cartController.getCart)         
router.delete('/users/:userId/cart',authenticate,cartController.deleteCart)

//......................Order Feature...........................//
router.post('/users/:userId/orders',orderController.createOrder)//a
router.put('/users/:userId/orders',orderController.updateOrder)//a


module.exports =router
 

