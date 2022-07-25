const userModel=require('../models/userModel')
const {uploadFile}=require('../router/aws')
const bcrypt = require('bcrypt');

const createUser=async function(req, res){
    try {
        let data=req.body
        let files=req.files
        const saltRounds = 10;
       
        //encrypting password
        const hash = bcrypt.hashSync(data.password, saltRounds);
        data.password=hash
        //  console.log( bcrypt.compareSync(password, hash))
        
       
        //uploading image to S3 
        if(files && files.length>0){let uploadedFileURL= await uploadFile( files[0] )
        data["profileImage"]=uploadedFileURL}
        
        else{res.status(400).send({ msg: "No file found" }) }


        let userData = await userModel.create(data);
        return  res.status(201).send({ status: true,  message: "User created successfully", data: userData })
        
    } catch (error) {

        return res.status(500).send({status:false, message:error.message});
    }
}


const getUserProfile = async function (req ,res) {
    try{
        userId = req.params.userId
        

    //     let token = req.headers["x-api-key"]
       
    //     if (!token) {return res.status(404).send({ status: false, msg: 'Token is Mandatory' })}
        
    //   let  decodedToken = jwt.verify(token, "")
    //   let userLoggedIn = decodedToken.userId

    //   if(userId != userLoggedIn) return res.send({status: false, msg:"user loggedIn is not allowed to get the profile details" })

        const profile = await userModel.findById(userId)
        if(profile == null){ 
            return res.status(404).send({status:false, message:"userProfile not found"})
        }
        else return res.status(200).send({status:true, message:"User profile details", data:profile})

    }
    catch(error){
        return res.status(500).send({status:false, message:error.message})
    }
}

module.exports ={createUser,getUserProfile} 