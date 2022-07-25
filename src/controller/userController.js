const userModel=require('../models/userModel')
const {uploadFile}=require('../router/aws')
const bcrypt = require('bcrypt');


const createUser=async function(req, res){
    try {
        let data=req.body
        console.log(data.address.shipping.city);
        let files=req.files
        const saltRounds = 10;
        let requestArray=Object.keys(data)
        let requestArrayOfAddress=Object.keys(data.address)
        let requiredFieldOfRequestArray=[ "fname","lname","email","password","phone","address"]
        let requiredFieldOfAddressArray=[ "street","city","pincode"]
      
        if(requestArray.length==0) return res.status(400).send({status:false,msg:"body can not be empty"})


        for(let i=0;i<requiredFieldOfRequestArray.length;i++){
             if(!requestArray.includes(requiredFieldOfRequestArray[i])) 
             return res.status(400).send({status:false,msg:requiredFieldOfRequestArray[i] +" is required"})

        }
        if(typeof data.address !="object") return res.status(400).send({status:false,msg:"address must be in object form"})
        if(!requestArrayOfAddress.includes("shipping"))return res.status(400).send({status:false,msg:"shipping address is required"})
        if(!requestArrayOfAddress.includes("billing"))return res.status(400).send({status:false,msg:"billing address is required"})
        if(typeof data.address.shipping !="object") return res.status(400).send({status:false,msg:"address must be in object form"}) 
        if(typeof data.address.billing !="object") return res.status(400).send({status:false,msg:"address must be in object form"}) 

        for(let j=0;j<requiredFieldOfAddressArray.length;j++){
          let shippingAddress=Object.keys(data.address.shipping)
          let billingAddress=Object.keys(data.address.billing)
            if(!billingAddress.includes(requiredFieldOfAddressArray[j])) 
            return res.status(400).send({status:false,msg:'Enter '+requiredFieldOfAddressArray[j] +"in billing address"})
            if(!shippingAddress.includes(requiredFieldOfAddressArray[j])) 
            return res.status(400).send({status:false,msg:'Enter '+requiredFieldOfAddressArray[j] +"in shipping address"})
       }
            
            
            
            
            
            
            
        //validate email
        //password length
        //must be object
        //mobile no validation
        //string data type validatiopn
        //pincode validation 
        //user name validation , must be alphabatic 

        //encrypting password
        const hash = bcrypt.hashSync(data.password, saltRounds);
        data.password=hash
        //  console.log( bcrypt.compareSync(password, hash))
        
       
        //uploading image to S3 
        // if(files && files.length>0){let uploadedFileURL= await uploadFile( files[0] )
        // data["profileImage"]=uploadedFileURL}
        
        // else{res.status(400).send({ msg: "No file found" }) }


        let userData = await userModel.create(data);
        return  res.status(201).send({ status: true,  message: "User created successfully", data: userData })
        
    } catch (error) {

        return res.status(500).send({status:false, message:error.message});
    }
}

module.exports ={createUser} 