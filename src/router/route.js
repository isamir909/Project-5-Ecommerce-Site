const express = require('express');
const router=express.Router();
const userController=require('../controller/userController')
const productController=require('../controller/productController')
const {authenticate}=require('../middleware/authentication')


router.post('/register',userController.createUser)
router.post('/login',userController.login)

router.get('/user/:userId/profile',authenticate,userController.getUserProfile)
router.put('/user/:userId/profile',authenticate,userController.updateData)
router.get('/products',productController.getProducts)





module.exports =router