const mongoose = require('mongoose');
const objectId=mongoose.Schema.type.objectId

const orderSchema=new mongoose.Schema({

    userId:{type:objectId, refs:'user',required:true},

    items: [
            {productId:{type:objectId,refs:'user',required:true}},
            {quantity:{type:Number,required:true}}
        ], 

    totalPrice:{type:Number,required:true},
    
    totalItems:{type:Number,required:true},

    totalQuantity:{type:Number,required:true},

    cancellable:{type: Boolean, default: true},

    status:{type:String,default: 'pending',enum:["pending", "completed", "cancled"]},

    deletedAt:{type:Date},

    isDeleted:{type: Boolean, default: false}
},{timestamps:true})

module.exports=mongoose.model('order',orderSchema)




// userId: {ObjectId, refs to User, mandatory},
// items: [{
//   productId: {ObjectId, refs to Product model, mandatory},
//   quantity: {number, mandatory, min 1}
// }],
// totalPrice: {number, mandatory, comment: "Holds total price of all the items in the cart"},
// totalItems: {number, mandatory, comment: "Holds total number of items in the cart"},
// totalQuantity: {number, mandatory, comment: "Holds total number of quantity in the cart"},
// cancellable: {boolean, default: true},
// status: {string, default: 'pending', enum[pending, completed, cancled]},
// deletedAt: {Date, when the document is deleted}, 
// isDeleted: {boolean, default: false},