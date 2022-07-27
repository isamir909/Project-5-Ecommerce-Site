const express = require('express');
const router=express.Router();
const userController=require('../controller/userController')
const {authenticate}=require('../middleware/authentication')
const productController = require ('../controller/productController')


router.post('/register',userController.createUser)
router.post('/login',userController.login)

router.get('/user/:userId/profile',authenticate,userController.getUserProfile)
router.put('/user/:userId/profile',authenticate,userController.updateData)

router.post('/products',productController.createProduct)






module.exports =router