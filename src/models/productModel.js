
const mongoose = require('mongoose');

const productModel= new mongoose.Schema({
    title: {type:String, required:true,unique:true,trim:true},

    description:{type:String, required:true, trim:true},

    price: {type: Integer, required: true,mandatory,trim: true},

    currencyId: {type: string, required:true, INR},

    currencyFormat: {type: String, required: true},

    isFreeShipping: {type: Boolean, default: false},

    productImage: {type: String, required: true},
    
    style: {type: String},

    availableSizes: {type:String},

    installments: {type: Ineger},

    deletedAt: {type: Date},

    isDeleted: {type: Boolean, default: false}
    
     }
,{timestamps:true})

module.exports =mongoose.model('product',productModel)