const productModel = require("../models/productModel");
const { uploadFile } = require("../router/aws");
const { isValid, isValidString } = require("../middleware/validation");

//----------POST /products
const createProduct = async function (req, res) {
    try {
        let data = req.body;
        let files = req.files;
        const { title, description, price, availableSizes, isFreeShipping,installments } = data;

        //---checking for empty body and empty image
        let requestArray = Object.keys(data); //taking request body in variable
        if (requestArray.length == 0)
            return res
                .status(400)
                .send({ status: false, msg: "body can not be empty" });
        if (files.length == 0)
            return res
                .status(400)
                .send({ status: false, msg: "Enter Product image" });
        let formate= files[0].originalname
       if(!(/\.(jpe?g|png|gif|bmp)$/i.test(formate) ||/\.(mkv|mov|mp4)$/i.test(formate)))return res.status(400).send({status:false,message:"file must be an image(jpg,png,jpeg,gif) OR Video (mkv,mp4,mov)"}) 
       

        //-------validation for required field

        let requiredFieldOfRequestArray = [
            title,
            description,
            price,
            availableSizes,
        ];
        let requiredField = ["title", "description", "price", "availableSizes"];

        for (let i = 0; i < requiredFieldOfRequestArray.length; i++) {
            if (!requestArray.includes(requiredField[i]))
                return res
                    .status(400)
                    .send({ status: false, msg: `${requiredField[i]} is required` });
        }
        //for empty values
        for (let j = 0; j < requiredFieldOfRequestArray.length; j++) {
            if (!isValid(requiredFieldOfRequestArray[j]))
                return res.status(400).send({
                    status: false,
                    msg: `${requiredField[j]} can not be undefined`,
                });
            if (!isValidString(requiredFieldOfRequestArray[j]))
                return res
                    .status(400)
                    .send({ status: false, msg: `${requiredField[j]} can not be empty` });
        }

        if (price.trim()) {
            let gtValue = Math.ceil(price.trim());
            let validPrice = /^\d+$/.test(gtValue);
            if (!validPrice)
                return res.status(400).send({
                    status: false,
                    msg: "Enter valid price ",
                });
            data.price = gtValue;
        }
        let sizes = ["S", "XS", "M", "X", "L", "XXL"];
        let reqSize = availableSizes.split(",");

        for (i = 0; i < reqSize.length; i++) {
            console.log(reqSize);
            if (!sizes.includes(reqSize[i].toUpperCase().trim()))
                return res.status(400).send({
                    status: false,
                    message: `This size: '${reqSize[i].trim()}' is not available`,
                });
                data.availableSizes=reqSize.map(function(x){return x.toUpperCase()});
        }
        //-----Shipping 
        data.isFreeShipping = isFreeShipping.trim();
        if (!(isFreeShipping.trim() == "true" || isFreeShipping.trim() == "false"))
            return res.status(400).send({
                status: false,
                message: "isFreeShipping should be true or false",
            });

        data["currencyId"] = "INR";
        data["currencyFormat"] = "₹";
        if(!(/^[1-9][0-9]{1}$/.test(installments.trim())))return res.status(400).send({status:false,msg:"enter valid instalment and it should be less than 100 & can not start with zero"})

        //-----for unique value
        let uniqueTitle = await productModel.findOne({ title: title });
        if (uniqueTitle)
            return res
                .status(404)
                .send({ status: false, message: "title should be unique" });
        //uploading product to S3
        let uploadedFileURL = await uploadFile(files[0]);
        data["productImage"] = uploadedFileURL;

        let productCreate = await productModel.create(data);
        return res
            .status(201)
            .send({ status: true, message: "Success", data: productCreate });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};

const getProducts = async function (req, res) {
    try {
        let requestQuery = req.query;
        let findData = { isDeleted: false };

        if (requestQuery.size) {
            let sizeFilter = requestQuery.size.split(",");
            sizeFilter = sizeFilter.map(function (x) {
                return x.toUpperCase();
            });
            let sizes = ["S", "XS", "M", "X", "L", "XXL"];
            for (i = 0; i < sizeFilter.length; i++) {
                if (!sizes.includes(sizeFilter[i]))
                    return res.status(400).send({
                        status: false,
                        message: `size '${sizeFilter[i]}' is not valid search request`,
                    });
            }
            findData["availableSizes"] = { $all: sizeFilter };
        }

        if (requestQuery.name) {
            findData["title"] = { $regex: requestQuery.name.toLowerCase() };
        }
        if (requestQuery.priceGreaterThan) {
            let gtValue = Math.ceil(requestQuery.priceGreaterThan);
            let validPrice = /^\d+$/.test(gtValue);
            if (!validPrice)
                return res.status(400).send({
                    status: false,
                    msg: "Enter valid input in priceGreaterThan",
                });
            findData["price"] = { $gt: requestQuery.priceGreaterThan };
        }
        if (requestQuery.priceLessThan) {
            let gtValue = Math.ceil(requestQuery.priceLessThan);
            let validPrice = /^\d+$/.test(gtValue);
            if (!validPrice)
                return res
                    .status(400)
                    .send({ status: false, msg: "Enter valid input in priceLessThan" });
            findData["price"] = { $lt: requestQuery.priceLessThan };
        }

        let findProduct = await productModel.find(findData).sort({ price: 1 });
        if (findProduct.length == 0)
            return res
                .status(404)
                .send({ status: false, msg: "no data found with this filters" });
        return res
            .status(200)
            .send({ status: true, message: "success", data: findProduct });
    } catch (error) {
        console.log(error);
        res.send(error.message);
    }
};
const updateProduct = async function (req, res) {

    try {

        let data = req.body;
        const productId = req.params.productId;
        const files = req.files
//enter id
//valid id
        let productData = await productModel.findOne({ _id: productId }).select({ _id: 0, updatedAt: 0, createdAt: 0, __v: 0 }).lean();
        if (!productData) return res.status(404).send({ status: false, msg: "ProductId is not Correct" })

        
    if(data.title){
    let findTitle = await productModel.findOne({ title: data.title });
        if (findTitle) return res.status(400).send({ status: false, msg: "This Title is already exist" });
    //null
    }
         productData.title = data.title
        productData.description = data.description;//null

        if(data.price){if(!validateNumber(data.price))return res.status(400).send({status:false,msg:'Price Must be in Integer'})}
        productData.price = data.price;
//if
        // if(!(data.isFreeShipping=="true" || data.isFreeShipping=="false")){return res.status(400).send({status:false,msg:"Input must be in True or False"})}
        // productData.isFreeShipping = data.isFreeShipping;
//lowercase

    if(data.style){
    productData.style = data.style;
    }

     
        var size = data.availableSizes.toUpperCase().split(",")
        for (let i = 0; i < size.length; i++) {
            if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size[i])) {
                return res.status(400).send({ status: false, message: "Size Must Contain S, XS, M, X, L, XXL, XL" });
                }
              //case sensitive use map fun
            //     else if(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size[i])){
            //         return res.status(400).send({ status: false, message: "This Size Already Exist" }) 
            // }
            
            productData.availableSizes = data.availableSizes.split(",")
        }

        
        productData.installments = data.installments;

        if (files) if (files.length != 0) {
            if (files && files.length > 0) {
                let uploadedFileURL = await uploadFile(files[0])
                productData.productImage = uploadedFileURL
            }
            else { return res.status(400).send({ msg: "Enter The Product image" }) }
        }
//image valid formate

        let updatedData = await productModel.findOneAndUpdate({ _id: productId }, { $set: productData }, { new: true });

        return res.status(200).send({ status: true, message: updatedData })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }



}
const getProductById = async function (req, res) {
    try{
      const productId = req.params.productId.trim()
  
      if(productId.length==0 ||productId==':productId')return res.status(400).send({status:false, message: "Enter user id" })
      if(!isValidObjectId(productId))return res.status(400).send({status:false, message: "Invalid product id" })
  
      const product = await productModel.findOne({_id:productId, isDeleted : false})
      if(product== null){return res.status(404).send({status:false, msg:"product not found"})}
      else{//response structure
          return res.status(200).send({status:true, msg:"Product Data",data:product})
      }
    }  
    catch (error) {
      
      return res.status(500).send({status:false, message:error.message});
  }
      
  }

  const deleteProductById = async function (req, res) {
    try{//response structure
        const productId = req.params.productId.trim()
        
    if(productId.length==0 ||productId==':productId')return res.status(400).send({status:false, message: "Enter user id" })
    if(!isValidObjectId(productId))return res.status(400).send({status:false, message: "Invalid product id" })
        
        const isProductdelete = await productModel.findOne({_id:productId,isDeleted:true})
        if(isProductdelete){return res.status(404).send({status:false,msg:"product not found"})}
        
        const productDelete = await productModel.findOneAndUpdate({_id:productId,isDeleted:false},{isDeleted:true, deletedAt: Date.now()})
        return res.status(200).send({status:true,msg:"product deleted successfully"})
    }
    catch(error) {
        return res.status(500).send({status:false,message:error.message})
    }
}




module.exports = { createProduct, getProducts,updateProduct ,deleteProductById,getProductById};
