const userModel=require('../models/userModel')
const {uploadFile}=require('../router/aws')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


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
//postlogin and jwt creation
const login = async function(req,res){
    try{
        let data = req.body
        if(Object.keys(data)===0) return res.status(400).send({status:false, message:"email and password required to login"})
        let {email,password} = data
        let user = await userModel.findOne({email:email , password:password});
        if(!user) return res.status(400).send({status:false, message:"User is not registered"});
        console.log(user)

    //-------------------JWT creation
        let token = jwt.sign({
            userId: user._id.toString(),
            exp: Math.floor(Date.now() / 1000) + (10 * 60),
            iat: new Date().getTime()
        }, "Project-5",
        );
        console.log(user._id.toString())
        
        return res.status(200).send({status: true, message: "User login successfull",data: {userId: user._id.toString(),token }})


    } catch (err){
        return res.status(500).send({error:err.message})
    }

}

// const getUserProfile = async function (req ,res) {
//     try{
//         userId = req.params.userId
        

//     //     let token = req.headers["x-api-key"]
       
//     //     if (!token) {return res.status(404).send({ status: false, msg: 'Token is Mandatory' })}
        
//     //   let  decodedToken = jwt.verify(token, "")
//     //   let userLoggedIn = decodedToken.userId

//     //   if(userId != userLoggedIn) return res.send({status: false, msg:"user loggedIn is not allowed to get the profile details" })

//         const profile = await userModel.findById(userId)
//         if(profile == null){ 
//             return res.status(404).send({status:false, message:"userProfile not found"})
//         }
//         else return res.status(200).send({status:true, message:"User profile details", data:profile})

//     }
//     catch(error){
//         return res.status(500).send({status:false, message:error.message})
//     }
// }


//--------------------------GET /user/:userId/profile (Authentication required)

const getUserProfile = async function (req,res){
    try{
        let id = req.params.userId
        let user = await userModel.findById(id)
        let token=req.headers.authorization
        if(!token) return res.status(401).send({status:false,message:"Authentication required"});
        
        let newToken = token.replace('Bearer ',"")
        //console.log(newToken)
//----------------------authorisation
        let decodedToken = jwt.verify(newToken, "Project-5")
        // jwt.verify(token, "Project-5", (err, decoded)=>{
        //     if(err){
        //         return res.status(401).send({status:false, message:err.message})
        //     } else {
        //         req['userId'] = decoded.userId
        //     }
        // })
        //const userAuthorised = req.userId
        const userAuthorised = decodedToken.userId
        //console.log(userAuthorised)
        if(id !== userAuthorised ) return res.status(403).send({status:false, message:"Authorisation failed"})
//-----------------------SerachingData
        const getData = await userModel.findById(id)
        return res.status(200).send({status:true,message:getData})

    } catch(err){
        return res.status(500).send({error:err.message})
    }}

//--------------------------------4-PUT /user/:userId/profile (Authentication and Authorization required)

const updateData = async function(req,res){
try{
        let data = req.body
        console.log(data)
        let id = req.params.userId
        let user = await userModel.findById(id)
        if(!user) return res.status(400).send({status:false, messahe:"User Not Found"})
        let token=req.headers.authorization
        if(!token) return res.status(401).send({status:false,message:"Authentication required"});
        let newToken = token.replace('Bearer ',"")
        //console.log(newToken)
//----------------------authorisation
        let decodedToken = jwt.verify(newToken, "Project-5")
        // jwt.verify(token, "Project-5", (err, decoded)=>{
        //     if(err){
        //         return res.status(401).send({status:false, message:err.message})
        //     } else {
        //         req['userId'] = decoded.userId
        //     }
        // })
        //const userAuthorised = req.userId
        const userAuthorised = decodedToken.userId
        if(id !== userAuthorised ) return res.status(403).send({status:false, message:"Authorisation failed"})

        let updatedData = await userModel.findOneAndUpdate(
            {_id: id},
            {$set:data},
            {new:true});
        return res.status(200).send({status:true,message:updatedData})

} catch(err){
    return res.status(500).send({error:err.message})
}}
//-------------------Exports
module.exports ={createUser,login,getUserProfile,updateData}
