const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const cartModel = require('../models/cartModel')
const {isValidObjectId,isValid}=require('../middleware/validation')

const createCart = async function (req, res) {
    try {
        let reqUserId = req.params.userId
        data = req.body
        const { productId } = data

        if(Object.keys(data).length==0)return res.status(400).send({ status: false, msg: "body can not be empty" });
        if(!isValidObjectId(productId))return res.status(400).send({status:false, message: "Invalid productId" })
       
        const findProductPrice = await productModel.findOne({ _id: productId.trim(),isDeleted:false })
        if(!findProductPrice)return res.status(404).send({status:false,msg:"Product not found"})

        const cart = await cartModel.findOne({ userId: reqUserId }).lean()
        if (!cart) {
            data["userId"] = reqUserId
            data["items"] = [{ productId: productId, quantity: 1 }]
            data["totalItems"] = 1
            data["totalPrice"] = findProductPrice.price
         let create = await cartModel.create(data)
         create=create.populate({path:'items.productId',model:'product',select:["_id","title","price","currencyFormat"]})

            return res.status(201).send({ status: true, msg: "cart created", Data: data })
        }

        //if product exist in cart
        for (let i = 0; i <cart.items.length; i++) {
            if (cart.items[i].productId.toString()== productId) {
                cart.items[i].quantity=cart.items[i].quantity + 1 
                cart.totalPrice=Number.parseFloat(cart.totalPrice+findProductPrice.price).toFixed(2)
             let addProduct=await cartModel.findOneAndUpdate({ userId: reqUserId },{$set:{items:cart.items,totalPrice:cart.totalPrice}},{new:true})
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

};

const updateCart = async function (req, res) {
    try {//- Check if the productId exists and is not deleted before updating the cart.
        let user = req.params.userId
        let update = req.body
        let { productId,removeProduct } = update

        if(Object.keys(update).length==0)return res.status(400).send({ status: false, msg: "body can not be empty" });
        //--------------------------objectIt Validation.................//
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid ProductId" })
        //---------------------checking in cart
        let cart = await cartModel.findOne({ userId: user})
        if (!cart) return res.status(404).send({ status: false, message: "cart does not exit" })
        //checking if cart is empty or not
        if (cart.items.length == 0) {return res.status(400).send({ status: false, message: "cart is empty" });}
        //------------------findingProduct.................//
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return res.status(404).send({ status: false, message: "Product not Found" })

        //---validation for removeProduct
        if (!(/0|1/.test(removeProduct))) {
            return res.status(400).send({ status: false, message: "removeProduct should be either 0 or 1" })
        }

        //----------finding productIdfrom cart
        
        let productid = cart.items.filter(x =>
            x.productId.toString() == productId
        )

        if (productid.length == 0) {
            return res.status(400).send({ status: false, message: "Product is not present in cart" })
        }
        //finding position of productId in cart which i found from 51 line
        let index = cart.items.indexOf(productid[0]);

        if (removeProduct == 1) {
            cart.items[index].quantity -= 1;//updating quantity
            cart.totalPrice =Number.parseFloat(cart.totalPrice - product.price).toFixed(2)//updating price
            if (cart.items[index].quantity == 0) {
                cart.items.splice(index, 1)
            }
            cart.totalItems = cart.items.length
            cart.save();
        }

        if (removeProduct == 0) {

            cart.totalPrice = Number.parseFloat(cart.totalPrice - product.price * cart.items[index].quantity).toFixed(2)//updating price here
            cart.items.splice(index, 1)//removing product
            cart.totalItems = cart.items.length//updating items
            cart.save()
        }
        return res.status(200).send({ status: true, message: "Data updated successfully", data: cart })

    } catch (err) {
        return res.status(500).send({ message: err.message })
    }
}



let getCart = async function (req, res) {
    try {
        let userId = req.params.userId.trim();
        let getData = await cartModel.findOne({ userId: userId }).populate({path:'items.productId',model:'product',select:["_id","title","price","currencyFormat"]})
        console.log(getData);
        if (getData==null) return res.status(404).send({ status: false, msg: "Cart for this user does not exist" });
        return res.status(200).send({ status: true, Data: getData })

    } catch (err) {
        console.log(err);
        return res.status(500).send({ status: false, Msg: err.Message })
    }
}


const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId.trim()
       
        const cart = await cartModel.findOne({ userId: userId }).select({ _id: 1 })
        if (!cart) { return res.status(404).send({ status: false, message: "Cart doe1s't exist" })}
     
        let deleteCart = await cartModel.findOneAndUpdate({ _id: cart }, { $set: { totalPrice: 0, totalItems: 0, items: [] } }, { new: true })
        return res.status(204).send()
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

module.exports = { createCart, updateCart ,getCart,deleteCart}



