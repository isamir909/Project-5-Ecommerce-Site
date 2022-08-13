const productModel = require("../models/productModel");
const { uploadFile } = require("../router/aws");
const { isValid, isValidObjectId } = require("../middleware/validation");

//----------POST /products
const createProduct = async function (req, res) {
    try {//user can upload multiple images,validate formate,available sises can not be repeated in array
        let data = req.body;
        let files = req.files;
        let { title, description, price, availableSizes, isFreeShipping, installments } = data;

        //checking for empty body and empty image
        let requestArray = Object.keys(data);
        if (requestArray.length == 0)
            return res.status(400).send({ status: false, msg: "body can not be empty" });
        if (files.length == 0) return res.status(400).send({ status: false, msg: "Enter Product image" });
        
        let formate = files[0].originalname
        if (!(/\.(jpe?g|png|gif|bmp)$/i.test(formate) || /\.(mkv|mov|mp4)$/i.test(formate))) return res.status(400).send({ status: false, message: "file must be an image(jpg,png,jpeg,gif) OR Video (mkv,mp4,mov)" })

        //................validation for required field......................//
        let requiredFieldOfRequestArray = [title,description,price,availableSizes];
        let requiredField = ["title", "description", "price", "availableSizes"];
        let missingFields=[]
        for (let i = 0; i < requiredFieldOfRequestArray.length; i++) { 

            if (!(isValid(requiredFieldOfRequestArray[i]))){
                missingFields.push(requiredField[i]) 
            }     
        }
        if(missingFields.length>0){  
            return res.status(400).send({ status: false, msg: `${missingFields} is required` })
        }
     

        if (price.trim()) {
            let Price=Number(price.trim())
             if(isNaN(Price)|| Price<0) {return res.status(400).send({status: false,msg: "Enter valid price "})
                }
            Price=Math.round(Price*100)/100
            data.price = Price;
        }

         let sizes = ["S", "XS", "M", "X", "L", "XXL", "XL"];
         let reqSize = availableSizes.split(",");
            reqSize=[... new Set(reqSize) ]
        // ..., which unpacks an iterable.   The Set object lets you store unique values of any type, whether primitive values or object references.
        for (i = 0; i < reqSize.length; i++) {     
            if (!sizes.includes(reqSize[i].trim().toUpperCase()))
            return res.status(400).send({status: false,message: `This size: '${reqSize[i].trim()}' is not valid size`,});
            data.availableSizes =reqSize.map(function (x) { return x.toUpperCase()})
           
        }

        //-----Shipping 
        if (data.isFreeShipping) {
            if (!(isFreeShipping.trim() == "true" || isFreeShipping.trim() == "false"))
            return res.status(400).send({status: false,message: "isFreeShipping should be true or false"});
            data.isFreeShipping = isFreeShipping.trim();

        }
        data["currencyId"] = "INR";
        data["currencyFormat"] = "₹";
        //can also use currency-symbol-map library for different currency input
        if(installments){
            installments=Number(installments.trim())
             if(isNaN(installments)|| installments<0) {return res.status(400).send({status: false,msg: "Enter valid installments Value "})
                }
            installments=Math.round(installments)
            data.installments = installments;
        }

        //-----for unique value
        let uniqueTitle = await productModel.findOne({ title: title });
        if(uniqueTitle)return res.status(400).send({ status: false, message: "title should be unique" });
        
        //uploading product to S3
        let uploadedFileURL = await uploadFile(files[0]);
        data["productImage"] = uploadedFileURL;

        let productCreate = await productModel.create(data);
        return res.status(201).send({ status: true, message: "Success", data: productCreate });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
};
//---------------------------get Product
const getProducts = async function (req, res) {
    try {
        let requestQuery = req.query;
        let findData = { isDeleted: false };


        if (isValid(requestQuery.size)) {
            let sizeFilter = requestQuery.size.split(",");
            sizeFilter = sizeFilter.map(function (x) {
            return x.toUpperCase()});
        
            let sizes = ["S", "XS", "M", "X", "L", "XXL", "XL"];
        for (i = 0; i < sizeFilter.length; i++) {
            if (!sizes.includes(sizeFilter[i]))
            return res.status(400).send({status: false,message: `size '${sizeFilter[i]}' is not valid search request`,
            });
        }
            findData["availableSizes"] = { $all: sizeFilter };
        }

        if (isValid(requestQuery.name)) {
            findData["title"] = { $regex: requestQuery.name.toLowerCase() };
        }


        if (isValid(requestQuery.priceGreaterThan)) {

            if(isNaN(requestQuery.priceGreaterThan)|| requestQuery.priceGreaterThan<0) {return res.status(400).send({status: false,msg: "Enter valid Number in priceGreaterThan "})}
            let gtValue = Math.round(requestQuery.priceGreaterThan);
            findData["price"] = { $gt:gtValue };
        }

        if (isValid(requestQuery.priceLessThan)) {

            if(isNaN(requestQuery.priceLessThan)|| requestQuery.priceLessThan<0) {return res.status(400).send({status: false,msg: "Enter valid Number in priceLessThan  "})}
            let gtValue = Math.round(requestQuery.priceLessThan);  
            findData["price"] = { $lt:gtValue };
        }

        let findProduct = await productModel.find(findData).sort({ price: 1 });
        
        if (findProduct.length == 0){
            return res.status(404).send({ status: false, msg: "no data found with this filters" });
            }
        return res.status(200).send({ status: true, message: "success", data: findProduct });

    } catch (error) {
        res.status(500).send({status:false,error:error.message});
    }
};


//----------------------------put api update product

const updateProduct = async function (req, res) {

    try {
        let data = req.body;
        const productId = req.params.productId;
        const files = req.files
        
        //enter id
        if (productId.length == 0 || productId == ':productId') return res.status(400).send({ status: false, message: "Enter Product  id" })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid productId" })

        let productData = await productModel.findOne({ _id: productId,isDeleted:false }).select({ _id: 0, updatedAt: 0, createdAt: 0, __v: 0 }).lean();
        if (!productData) return res.status(404).send({ status: false, msg: "ProductId Not found" })

        if (data.title) {
            if (!isValid(data.title)) return res.status(400).send({ status: false, msg: "Enter valid title" });
            let findTitle = await productModel.findOne({ title: data.title,_id:{$ne:productId} });
            if (findTitle) return res.status(400).send({ status: false, msg: "This Title is already exist" });
            productData.title = data.title
        }
        if (data.description) {
            if (!isValid(data.description)) { return res.status(400).send({ status: false, msg: "Title input is empty" }) };
            productData.description = data.description;
        }
        if (data.price) {
            let Price=Number(data.price.trim())
             if(isNaN(Price)|| Price<0) {return res.status(400).send({status: false,msg: "Enter valid price "})}
            Price=Math.round(Price*100)/100
            productData.price = Price
            
        }
       
        if (data.isFreeShipping) {
            let isFreeShippingValid = data.isFreeShipping.trim().toLowerCase();
            if (!(isFreeShippingValid == "true" || isFreeShippingValid == "false")) { return res.status(400).send({ status: false, msg: "Input must be in True or False" }) }
            productData.isFreeShipping = isFreeShippingValid;
        }

        if (data.style) {
            if(!isValid(data.style)){ return res.status(400).send({ status: false, msg: "Enter valid data in style" }) };
            productData.style = data.style;
        }

        if (data.availableSizes) {
              let reqSize = data.availableSizes.split(",")
              reqSize=[... new Set(reqSize) ]

            for (i = 0; i < reqSize.length; i++) {       
                if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(reqSize[i].trim().toUpperCase()))
                return res.status(400).send({status: false,message: `This size: '${reqSize[i].trim()}' is not valid size`,});
            }
            productData.availableSizes =reqSize.map(function (x) { return x.toUpperCase()})
        }

        if (data.installments) {
            let installments=Number(data.installments.trim())
             if(isNaN(installments)|| installments<0) {return res.status(400).send({status: false,msg: "Enter valid installments Value "})
                }
            installments=Math.round(installments) 
            productData.installments =installments;
        }

        // if (files) if (files.length != 0) {
            if (files && files.length > 0) {
                let formate = files[0].originalname
                if (!(/\.(jpe?g|png|gif|bmp)$/i.test(formate) || /\.(mkv|mov|mp4)$/i.test(formate))) return res.status(400).send({ status: false, message: "file must be an image(jpg,png,jpeg,gif) OR Video (mkv,mp4,mov)" })

                let uploadedFileURL = await uploadFile(files[0])
                productData.productImage = uploadedFileURL
            }//
     

        let updatedData = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { $set: productData }, { new: true });

        return res.status(200).send({ status: true, message: updatedData })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
};

//--------------------get product By Id
const getProductById = async function (req, res) {
    try {
        const productId = req.params.productId.trim()

        if (productId.length == 0 || productId == ':productId') return res.status(400).send({ status: false, message: "Enter user id" })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid product id" })

        const product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (product == null) { return res.status(404).send({ status: false, msg: "product not found" }) }
        else {
            return res.status(200).send({ status: true, msg: "Product Data", data: product })
        } 
    }
    catch (error) {

        return res.status(500).send({ status: false, message: error.message });
    }
};


//--------------------delete Product by Id
const deleteProductById = async function (req, res) {
    try {
        const productId = req.params.productId.trim()

        if (productId.length == 0 || productId == ':productId') return res.status(400).send({ status: false, message: "Enter user id" })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid product id" })

        const isProductDelete = await productModel.findOne({ _id: productId, isDeleted: true })
        if (isProductDelete) { return res.status(404).send({ status: false, msg: "product not found" }) }

        const productDelete = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { isDeleted: true, deletedAt: Date.now() })
        return res.status(200).send({ status: true, msg: "product deleted successfully" })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
};




module.exports = { createProduct, getProducts, updateProduct, deleteProductById, getProductById };
