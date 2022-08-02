const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const cartModel = require('../models/cartModel')
const {isValidObjectId}=require('../middleware/validation')

const createCart = async function (req, res) {
    try {
        let reqUserId = req.params.userId
        data = req.body
        const { productId } = data

        if(Object.keys(data).length==0)return res.status(400).send({ status: false, msg: "body can not be empty" });
        if(!isValidObjectId(productId))return res.status(400).send({status:false, message: "Invalid productId" })
       
        const findProductPrice = await productModel.findOne({ _id: productId })
        if(!findProductPrice)return res.status(404).send({status:false,msg:"Product not found"})

        const cart = await cartModel.findOne({ userId: reqUserId }).lean()
        if (!cart) {
            data["userId"] = reqUserId
            data["items"] = [{ productId: productId, quantity: 1 }]
            data["totalItems"] = 1
            data["totalPrice"] = findProductPrice.price
            create = await cartModel.create(data)
            return res.status(201).send({ status: true, msg: "cart created", Data: data })
        }

        //if product exist in cart
        for (let i = 0; i <cart.items.length; i++) {
            if (cart.items[i].productId.toString()== productId) {
                cart.items[i].quantity=cart.items[i].quantity + 1 

            let addProduct=await cartModel.findOneAndUpdate({ userId: reqUserId }, { $inc:{totalPrice:findProductPrice.price},$set:{items:cart.items}},{new:true})
            return res.status(200).send({status:true,msg:"product added",Data:addProduct})
        }}
        
        //if product is not present in cart
        let updateCartObject={
            $addToSet:{items:{productId:productId,quantity:1}},
            $inc:{totalPrice:findProductPrice.price,totalItems:1}
        }
        let updateCart=await cartModel.findOneAndUpdate({ userId: reqUserId },updateCartObject,{new:true})
            return res.status(200).send({status:true,msg:"product added",Data:updateCart})
       

    } catch (error) {
        console.log(error)
        return res.status(500).send({ msg: error.message })
    }

}//

module.exports = { createCart }
//token required
//userid in params
//if user deleted not allow login
//db call to check cart with userid  + //authentication
//push product if product is not deleted
// Make sure the product(s) are valid and not deleted.
// - Get product(s) details in response body.
//  -->

// - Create a cart for the user if it does not exist. Else add product(s) in cart.
// - Get cart id in request body.
// - Get productId in request body.
// - Make sure that cart exist.
// - Add a product(s) for a user in the cart.
// - Make sure the userId in params and in JWT token match.
// - Make sure the user exist
// - Make sure the product(s) are valid and not deleted.
// - Get product(s) details in response body.



// {
//     "_id": ObjectId("88abc190ef0288abc190ef88"),
//     userId: ObjectId("88abc190ef0288abc190ef02"),
//     items: [{
//       productId: ObjectId("88abc190ef0288abc190ef55"),
//       quantity: 2
//     }, {
//       productId: ObjectId("88abc190ef0288abc190ef60"),
//       quantity: 1
//     }],
//     totalPrice: 50.99,
//     totalItems: 2,
//     createdAt: "2021-09-17T04:25:07.803Z",
//     updatedAt: 


