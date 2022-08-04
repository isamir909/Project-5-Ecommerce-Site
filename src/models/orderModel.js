const mongoose = require('mongoose');
const objectId=mongoose.Schema.Types.ObjectId

const orderSchema=new mongoose.Schema({

    userId:{type:objectId, refs:'user',required:true},

    items: [
        {
            productId:{type:objectId,ref:"product",required:true},
            quantity:{type:Number,required:true, min:1},
            _id:false
        } 
        ], 


    totalPrice:{type:Number,required:true},
    
    totalItems:{type:Number,required:true},

    totalQuantity:{type:Number,required:true},

    cancellable:{type: Boolean, default: true,trim:true,lowercase:true},

    status:{type:String,default: 'pending',enum:["pending", "completed", "cancelled"],trim:true,lowercase:true},

    deletedAt:{type:Date},

    isDeleted:{type: Boolean, default: false}
},{timestamps:true})

module.exports=mongoose.model('order',orderSchema)

