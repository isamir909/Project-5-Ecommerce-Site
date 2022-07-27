const productModel=require('../models/productModel')

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
module.exports={getProducts}

 


// Returns all products in the collection that aren't deleted.
// - __Filters__
//   - Size (The key for this filter will be 'size')
//   - Product name (The key for this filter will be 'name'). You should return all the products with name containing the substring recieved in this filter
//   - Price : greater than or less than a specific value. The keys are 'priceGreaterThan' and 'priceLessThan'. 
  
// > **_NOTE:_** For price filter request could contain both or any one of the keys. For example the query in the request could look like { priceGreaterThan: 500, priceLessThan: 2000 } or just { priceLessThan: 1000 } )
  
// - __Sort__
//   - Sorted by product price in ascending or descending. The key value pair will look like {priceSort : 1} or {priceSort : -1}
// _eg_ /products?size=XL&name=Nit%20grit
