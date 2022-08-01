const express = require('express');
const router=express.Router();
const userController=require('../controller/userController')
const productController=require('../controller/productController')
const cartController=require('../controller/cartController')
const {authenticate}=require('../middleware/authentication')
  
//......................User Feature...........................//
router.post('/register',userController.createUser)
router.post('/login',userController.login)
router.get('/user/:userId/profile',authenticate,userController.getUserProfile)
router.put('/user/:userId/profile',authenticate,userController.updateData)


//......................Product Feature...........................//
router.post('/products',productController.createProduct)
router.get('/products',productController.getProducts)
router.get('/products/:productId',productController.getProductById)
router.put('/products/:productId',productController.updateProduct)
router.delete('/products/:productId',productController.deleteProductById)

//......................Cart Feature...........................//
router.post('/users/:userId/cart',cartController.createCart)


module.exports =router