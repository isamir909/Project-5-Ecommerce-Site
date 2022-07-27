const productModel = require('../models/productModel');
const { uploadFile } = require('../router/aws')
const {isValid, isValidString} = require('../middleware/validation')


 
//----------POST /products
const createProduct = async function(req,res){
    try{
        let data = req.body
        let files = req.files
        let availableSizes=data.availableSizes
        let isFreeShipping=data.isFreeShipping
        //console.log(isFreeShipping)
        //---checking for empty body and empty image
        let requestArray = Object.keys(data)//taking request body in variable
        if (requestArray.length == 0) return res.status(400).send({ status: false, msg: "body can not be empty" })
        if (files.length == 0) return res.status(400).send({ status: false, msg: "Enter Product image" });
        //-------validation for required field
        const {title,description,price} = data//destructuring

        let requiredFieldOfRequestArray = [title,description,price]
        let requiredField = ["title","description","price" ]
        
        for (let i = 0; i < requiredFieldOfRequestArray.length; i++) {
            if (!requestArray.includes(requiredField[i]))
                return res.status(400).send({ status: false, msg: `${requiredField[i]} is required`})
        }
        //for empty values
        for (let j = 0; j < requiredFieldOfRequestArray.length; j++) {
            if (!isValid(requiredFieldOfRequestArray[j])) return res.status(400).send({ status: false, msg: `${requiredField[j]} can not be undefined` })
            if (!isValidString(requiredFieldOfRequestArray[j])) return res.status(400).send({ status: false, msg: `${requiredField[j]} can not be empty` })
        }
        //-----for unique value
        let uniquetitle = await productModel.findOne({title:title})
        if(uniquetitle) return res.status(404).send({status:false,message:"title should be unique"})

        let currencyId='INR'
        let currencyFormat = "₹"
        let sizes =["S","XS","M","X","L","XXL"]
        for (i=0;i<availableSizes.length;i++){ 
            if(!sizes.includes(availableSizes[i])) 
             return res.status(400).send({status:false,message: "This size is not available"} )
        }
        //-----Shipping
        if( !(isFreeShipping == "true" || isFreeShipping == "false") ) 
         return res.status(400).send({status:false,message: "isFreeShipping should be true or false"} )
            
        //data['availableSizes']=availableSizes
        data['currencyId']=currencyId
        data["currencyFormat"] =currencyFormat
    
         //uploading product to S3 
        
        let uploadedFileURL = await uploadFile(files[0])
        data["productImage"] = uploadedFileURL
       
        let productCreate = await productModel.create(data)
        return res.status(201).send({status:true,message:'Success',data:productCreate})

    } catch(err){
        return res.status(500).send({error:err.message})
    }
};


const getProducts=async function(req,res){
try {
    let requestQuery=req.query 
    let findData={isDeleted:false}

    if(requestQuery.size){
        let  sizeFilter=requestQuery.size
        sizeFilter=requestQuery.size.split(',')
        console.log(sizeFilter)
        findData['availableSizes']={$all:sizeFilter}
    } 

    if(requestQuery.name){
        findData['title']={$regex:requestQuery.name} 
    }
    if(requestQuery.priceGreaterThan){
        let val=Math.ceil(-50.60 )
        let validPrice=/^\d+$/.test(val)
      if(!validPrice)
        findData['price']={$gt:requestQuery.priceGreaterThan} 
     } 
     if(requestQuery.priceLessThan){
        findData['price']={$lt:requestQuery.priceLessThan} 
     }
     console.log(findData);
     let findProduct=await productModel.find(findData).sort({price:1})  
  
     res.send(findProduct)

} catch (error) {
    console.log(error);
    res.send(error.message)
}
}



module.exports = { createProduct,getProducts }
