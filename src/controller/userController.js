const userModel = require('../models/userModel')
const { uploadFile } = require('../router/aws')
const bcrypt = require('bcrypt'); 
const validator = require('validator');
const jwt = require('jsonwebtoken');
const { isValid, validateMobile, validPinCode, isValidObjectId, validPassword } = require('../middleware/validation');
const { default: isEmail } = require('validator/lib/isemail');


const createUser = async function (req, res) {
    try {
        let data=req.body
        let files=req.files
        const {fname,lname,email,password,phone,address}=data

        let requestArray=Object.keys(data)
        let requiredFieldOfAddressArray=[ "street","city","pincode"]
       
        if(files && files.length>0){
        let formate = files[0].originalname
        if (!(/\.(jpe?g|png|bmp)$/i.test(formate))) return res.status(400).send({ status: false, message: "file must be an image(jpg,png,jpeg)" })
        }
        if(requestArray.length==0) return res.status(400).send({status:false,msg:"body can not be empty"})
        if(files.length==0) return res.status(400).send({status:false,msg:"Enter profile image"});
   
        //For required  fields 
        let requiredFieldOfRequestArray=[ "fname","lname","email","password","phone","address"]
        let missingFields=[]
        let valuesOfData=[fname,lname,email,password,phone,address]
        for(let i=0;i<requiredFieldOfRequestArray.length;i++){ 
             if(!isValid(valuesOfData[i])) 
             missingFields.push(requiredFieldOfRequestArray[i]) 
         }
         if(missingFields.length>0){  
            return res.status(400).send({ status: false, msg: `${missingFields} is required` })
        }
        //for address
         let requestArrayOfAddress=Object.keys(data.address)
  
        if(typeof data.address !="object") return res.status(400).send({status:false,msg:"address must be in object form"})
        if(!requestArrayOfAddress.includes("shipping"))return res.status(400).send({status:false,msg:"shipping address is required"})
        if(!requestArrayOfAddress.includes("billing"))return res.status(400).send({status:false,msg:"billing address is required"})
        if(typeof data.address.shipping !="object") return res.status(400).send({status:false,msg:"address must be in object form"}) 
        if(typeof data.address.billing !="object") return res.status(400).send({status:false,msg:"address must be in object form"}) 

        //For required  fields of Address object
        let requiredShipping=[]
        let shippingAddress =["street", "city", "pincode"]

        for (let j = 0; j <shippingAddress.length; j++) {

            const {street, city, pincode } = data.address.billing
            const valueOfShippingAddress = [street, city, pincode]
            if(!isValid(valueOfShippingAddress[j])){
                requiredShipping.push(shippingAddress[j])
            }
         }
            if(requiredShipping.length>0){return res.status(400).send({ status: false, msg: 'Enter ' + requiredShipping + "in shipping address" })
        }
        let requiredBilling=[]
        let billingAddress =  ["street", "city", "pincode"]
        for (let k = 0; k < requiredFieldOfAddressArray.length; k++) {
            const { street, city, pincode } = data.address.shipping
            const valueOfBillingAddress = [street, city, pincode]
          
            if(!isValid(valueOfBillingAddress[k])){
                requiredShipping.push(billingAddress[k])
            }
        }
        if(requiredBilling.length>0){return res.status(400).send({ status: false, msg: 'Enter ' + requiredBilling + "in billing address" })        }

        if (!validator.isAlpha(fname.trim())) return res.status(400).send({ status: false, msg: 'fname must be between a-z or A-Z' });
        if (!validator.isAlpha(lname.trim())) return res.status(400).send({ status: false, msg: 'lname must be between a-z or A-Z' });
        if (!validator.isAlpha(address.billing.city.trim())) return res.status(400).send({ status: false, msg: 'city name in billing must be between a-z or A-Z' });
        if (!validator.isAlpha(address.shipping.city.trim())) return res.status(400).send({ status: false, msg: 'city name in shipping must be between a-z or A-Z' });

        if (!isEmail(email.trim())) return res.status(400).send({ status: false, msg: 'email must be a valid email address' });
        if (password.length < 8 || password.length > 15) return res.status(400).send({ status: false, msg: 'password must be at least 8 characters long and should be less than 15 characters' });
        if (!validPassword(password)) return res.status(400).send({ status: false, msg: "Enter valid password it should contain one capital letter and one special character(@#$%&*!)  " });

        if (!validateMobile(phone.trim())) return res.status(400).send({ status: false, msg: "must be valid mobile number" });
        if (!validPinCode(address.billing.pincode.trim())) return res.status(400).send({ status: false, msg: "Enter valid pin code billing address" });
        if (!validPinCode(address.shipping.pincode.trim())) return res.status(400).send({ status: false, msg: "Enter valid pin code in shipping address" });
        //unique
        let findMobile = await userModel.findOne({ phone: phone.trim() })
        if (findMobile) return res.status(400).send({ status: false, msg: "This phone number is already in use" });
        let findEmail = await userModel.findOne({ email: email.trim() })
        if (findEmail) return res.status(400).send({ status: false, msg: "This Email is already in use" });

        //encrypting password
        const saltRounds = 10; 
        const hash = bcrypt.hashSync(data.password, saltRounds);
        data.password = hash
        
        //uploading image to S3 
        if (files && files.length > 0) {
            let uploadedFileURL = await uploadFile(files[0])
            data["profileImage"] = uploadedFileURL
        }
       
        let newUserData = await userModel.create(data);
        newUserData= newUserData.toObject()
        delete newUserData.password
        return res.status(201).send({ status: true, message: "User created successfully", data: newUserData })
    } catch (error) {  
        return res.status(500).send({status:false, message:error.message});
    } 
};


//postlogin and jwt creation
const login = async function (req, res) {
    try {
       
        let email = req.body.email
        let password = req.body.password;

        if (Object.keys(req.body).length == 0) {
            return res.status(400).send({ status: false, Msg: "Data is required" })
        }

        if (!email) return res.status(401).send({ status: false, message: "Email Is Required" });
        if (email.trim() == "") {
            return res.status(400).send({ status: false, message: "Email can't be empty." })
        }
        if (!password) {
            return res.status(400).send({ status: false, message: "Password is required" })
        }
        if (password.trim() == "") {
            return res.status(400).send({ status: false, message: "Password can't be empty." })
        }
        if (!isEmail(email)) return res.status(400).send({ status: false, msg: 'email must be a valid email address' });

        let checkEmail = await userModel.findOne({ email: email.trim() })
        if (!checkEmail) return res.status(404).send({ status: false, message: "User not found" });

        let hash = checkEmail.password 
        let compare = bcrypt.compareSync(password, hash)
        if (!compare) return res.status(401).send({ status: false, msg: "Password Incorrect" })

        let token = jwt.sign({
            id: checkEmail._id.toString(),
            iat: Math.floor(new Date().getTime() / 1000)
        },
            "Product Management Project@#$%, team No.= 02", { expiresIn: "3h" });

        res.setHeader("x-api-key", token);
        res.status(200).send({ status: true, message: "User login successfully", data: { userId: checkEmail._id, token: token } });

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

const getUserProfile = async function (req, res) {
    try {//can remove objectid validation 
        userId = req.params.userId
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid user id" })

        let profile = await userModel.findById(userId)
        if (profile == null) {
            return res.status(404).send({ status: false, message: "userProfile not found" })
        }

        profile= profile.toObject()
        delete profile.password
        return res.status(200).send({ status: true, message: "User profile details", data: profile })

    }catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
};


const updateData = async function (req, res) {
    try {
        let data = req.body
        const userId = req.params.userId
        const files = req.files

     
        let userdata = await userModel.findOne({ _id: userId }).select({ _id: 0, updatedAt: 0, createdAt: 0, __v: 0 }).lean();

        if (data.fname) {
            if (!validator.isAlpha(data.fname.trim())) return res.status(400).send({ status: false, msg: 'fname must be between a-z or A-Z' })
            userdata.fname = data.fname
        }

        if (data.lname) {
            if (!validator.isAlpha(data.lname.trim())) return res.status(400).send({ status: false, msg: 'lname must be between a-z or A-Z' })
            userdata.lname = data.lname
        }
        if (data.password) {
            if (data.password.length < 8 || data.password.length > 15) return res.status(400).send({ status: false, msg: 'password must be at least 8 characters long and should be less than 15 characters' })
            //password regex
            const saltRounds = 10;
            const hash = bcrypt.hashSync(data.password, saltRounds);
            userdata.password = hash
        }

        if (data.address) {
            if (data.address.billing) {
                if (data.address.billing.city) {
                    if (!validator.isAlpha(data.address.billing.city.trim())) return res.status(400).send({ status: false, msg: 'city name in billing must be between a-z or A-Z' })
                    userdata.address.billing.city = data.address.billing.city
                }
            }
        }

        if (data.address) {
            if (data.address.billing) {
                if (data.address.billing.pincode) {
                    if (!validPinCode(data.address.billing.pincode)) return res.status(400).send({ status: false, msg: "Enter valid pin code billing address" });
                    userdata.address.billing.pincode = data.address.billing.pincode
                }
            }
        }
        if (data.address) {
            if (data.address.billing) {
                if (data.address.billing.street) {
                    userdata.address.billing.street = data.address.billing.street
                }
            }
        }

        if (data.address) {
            if (data.address.shipping) {
                if (data.address.shipping.city) {
                    if (!validator.isAlpha(data.address.shipping.city.trim())) return res.status(400).send({ status: false, msg: 'city name in shipping must be between a-z or A-Z' })
                    userdata.address.shipping.city = data.address.shipping.city
                }
            }
        }

        if (data.address) {
            if (data.address.shipping) {
                if (data.address.shipping.pincode) {
                    if (!validPinCode(data.address.shipping.pincode)) return res.status(400).send({ status: false, msg: "Enter valid pin code shipping address" });
                    userdata.address.shipping.pincode = data.address.shipping.pincode
                }
            }
        }

        if (data.address) {
            if (data.address.shipping) {
                if (data.address.shipping.street) {
                    userdata.address.shipping.street = data.address.shipping.street
                }
            }
        }

        if (data.email) {
            if (!isEmail(data.email)) return res.status(400).send({ status: false, msg: 'email must be a valid email address' })
           let checkEmail = await userModel.findOne({email:data.email,_id:{$ne:userId}})
            if(checkEmail){return res.status(400).send({status:false,msg:`this email ${data.email} is already in use try another Email`})}
    
            userdata.email = data.email
            //check for uniqueness 
        }
        if (data.phone) {
            if (!validateMobile(data.phone)) return res.status(400).send({ status: false, msg: "must be valid mobile number" });
             let checkPhone  = await userModel.findOne({phone:data.phone,_id:{$ne:userId}})
            if(checkPhone){return res.status(400).send({status:false,msg:"this Phone number already exist"})}
            
            userdata.phone = data.phone
            //check for uniqueness 
        }
       
            if (files && files.length > 0) {
                let formate = files[0].originalname
                if (!(/\.(jpe?g|png|bmp)$/i.test(formate))) return res.status(400).send({ status: false, message: "file must be an image(jpg,png,jpeg)" })
                let uploadedFileURL = await uploadFile(files[0])
                userdata.profileImage = uploadedFileURL
            }

       let updatedData = await userModel.findOneAndUpdate({ _id: userId }, { $set: userdata }, { new: true });
        updatedData= updatedData.toObject()
        delete updatedData.password
        return res.status(200).send({ status: true,message:"data updated successfully", data: updatedData })

    } catch (err) {
       
        return res.status(500).send({ error: err.message })
    }
}

module.exports = { createUser, getUserProfile, login, updateData } 
