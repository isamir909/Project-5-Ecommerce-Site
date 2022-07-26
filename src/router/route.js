const express = require('express');
const router=express.Router();
const userController=require('../controller/userController')
const {authenticate}=require('../middleware/authentication')


router.post('/register',userController.createUser)
router.post('/login',userController.login)

router.get('/user/:userId/profile',authenticate,userController.getUserProfile)
router.put('/user/:userId/profile',authenticate,userController.updateData)






module.exports =router