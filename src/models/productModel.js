
const mongoose = require('mongoose'); 

const productModel= new mongoose.Schema({
    title: {type:String, required:true,unique:true,trim:true},

    description:{type:String, required:true, trim:true},

    price: {type: Number, required: true,trim: true},//(50.00) , minus value

    currencyId: {type: String, required:true},

    currencyFormat: {type: String, required: true,default : "₹"},

    isFreeShipping: {type: Boolean, default: false},

    productImage: {type: String, required: true},//must be image formate

    style: {type: String,trim:true},

    availableSizes: [{type:String}], //should not update already present size //replace whole array in update //case insensitive

    installments: {type: Number}, //no decimal,must be two digit,positive value

    deletedAt: {type: Date},

    isDeleted: {type: Boolean, default: false}
    
     }
,{timestamps:true})

module.exports =mongoose.model('product',productModel)