const express = require('express');
const router=express.Router();
const userController=require('../controller/userController')



router.post('/register',userController.createUser)
router.post('/login',userController.login)

router.get('/user/:userId/profile',userController.getUserProfile)







module.exports =router