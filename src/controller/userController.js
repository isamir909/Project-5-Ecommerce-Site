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

module.exports ={createUser} 