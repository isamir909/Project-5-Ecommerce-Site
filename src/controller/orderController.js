const { default: mongoose } = require('mongoose')
const cartModel = require('../models/cartModel')
const orderModel = require('../models/orderModel')

const createOrder=async function (req,res){
try {
    let reqUserId=req.params.userId
    let data=req.body
    const{status,cancellable}=data 

    let cart=await cartModel.findOne({userId:reqUserId})
 
    if(!cart)return res.status(404).send({status:false,msg:"no cart found"})
//    if(cart.items.length=0){   return res.status(400).send({status:false,msg:"can not place order, add product in cart"})}

    if(cancellable){ 
        if(!(cancellable.toLowerCase().trim()=="true" || cancellable.toLowerCase().trim()=="false" )){
            return res.status(400).send({status:false,msg:"cancellable should be true or false"})
        }
      
    };
  

    if(status){
        if(cancellable.toLowerCase().trim()=="false" && status=="cancelled")return res.status(400).send({status:false,msg:"if cancellable is  false then status value can not be cancelled   "})
        if(!["pending", "completed", "cancelled"].includes(status.toLowerCase().trim())){ return res.status(400).send({status:false,msg:"Status must be among [pending,completed,cancelled]"})}
       
    }

    let totalQuantity=0
    for(let i=0;i<cart.items.length;i++){
        totalQuantity +=cart.items[i].quantity 
    }


    const orderDetails = { 
        userId: reqUserId,
        items:cart.items,
        totalPrice: cart.totalPrice,
        totalItems: cart.totalItems,
        totalQuantity: totalQuantity,
        cancellable,
        status,
    };



   let createOrder= await orderModel.create(orderDetails) 
   return res.status(201).send({ status: true, message: "order created successfully", data: createOrder })
    
} catch (error) {
    console.log(error)
    return res.status(500).send({ status: false, message: error.message })
    
}
}
 

module.exports={createOrder}
