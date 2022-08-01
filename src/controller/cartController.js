const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const cartModel = require('../models/cartModel')
const {isValidObjectId}=require('../middleware/validation')

const createCart = async function (req, res) {
    try {
        let reqUserId = req.params.userId
       
        data = req.body
        const { productId } = data
        //db call user exist or not
        const cart = await cartModel.findOne({ userId: reqUserId }).lean()
        findProductPrice = await productModel.findOne({ _id: productId })
        if (!cart) {
            data["userId"] = reqUserId
            data["items"] = [{ productId: productId, quantity: 1 }]
            data["totalItems"] = 1

            data["totalPrice"] = findProductPrice.price
            create = await cartModel.create(data)
            return res.status(201).send({ status: true, msg: "cart created", Data: data })
        }
        let productList = []

        for (let i = 0; i < cart.items.length; i++) {
            productList.push(cart.items[i].productId.toString())
        }

        for (let j = 0; j < productList.length; j++) {
            // let index=productList.indexOf(productId)

            if (productList[j] == productId) {
                let quantities = cart.items[j].quantity
                if (quantities) { (cart.items[j].quantity = quantities + 1) && (cart.totalPrice = cart.totalPrice + findProductPrice.price) }
            }

            await cartModel.findOneAndUpdate({ userId: reqUserId }, { $set: cart })

        }
        if (!productList.includes(productId)) {
            let obj = {}
            let items = cart.totalItems
            let price = cart.totalPrice
            let productPrice = findProductPrice.price
      
            obj["productId"] = productId
            obj["quantity"] = 1
           console.log(obj);

            (cart.items.push(obj)) && (cart.totalItems = items + 1) && (cart.totalPrice = (price + productPrice))
            await cartModel.findOneAndUpdate({ userId: reqUserId }, { $set: cart })
        }
    
        let response = await cartModel.findOne({ userId: reqUserId })
        res.send({ data: response })

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


