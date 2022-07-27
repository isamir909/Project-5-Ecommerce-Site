
const mongoose = require('mongoose');

const productModel= new mongoose.Schema({
    title: {type:String, required:true,unique:true,trim:true},

    description:{type:String, required:true, trim:true},

    price: {type: Number, required: true,trim: true},//validation

    currencyId: {type: String, required:true, default: 'INR'},

    currencyFormat: {type: String, required: true,default : "₹"},

    isFreeShipping: {type: Boolean, default: false},

    productImage: {type: String, required: true},//must be image
    
    style: {type: String},

    availableSizes: [{type:String}],

    installments: {type: Number},//must be number

    deletedAt: {type: Date},

    isDeleted: {type: Boolean, default: false}
    
     }
,{timestamps:true})

module.exports =mongoose.model('product',productModel)