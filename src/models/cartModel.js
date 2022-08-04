const mongoose =require('mongoose')
const objectId =mongoose.Schema.Types.ObjectId


const cartSchema = new mongoose.Schema({
  userId: {
    type: objectId,
    refs: 'user',
    required: true
  },
  items: [{
    productId: {
         type:objectId,
        refs:'product',
        required: true 
    },
    quantity: {
         type: Number, 
         required: true 
        },
        _id:false
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  }
}, { timestamps: true })



module.exports = mongoose.model('Cart', cartSchema)