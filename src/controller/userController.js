const userModel = require('../models/userModel')
const { uploadFile } = require('../router/aws')
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const { isValidString, isValid, validateMobile, validPinCode, isValidObjectId, validPassword } = require('../middleware/validation');
const { default: isEmail } = require('validator/lib/isemail');
const bodyParser = require('body-parser');

const createUser = async function (req, res) {
    try { //line 66 address data type validation 
        let data=req.body
        let files=req.files
        const {fname,lname,email,password,phone,address}=data
        let requestArray=Object.keys(data)
        let requiredFieldOfRequestArray=[ "fname","lname","email","password","phone","address"]
        let valuesOfData=[fname,lname,email,password,phone]
        if(files.length == 0) return res.status(400).send({ status: false, message: "Profile image is required" })
        let formate = files[0].originalname
        if (!(/\.(jpe?g|png|bmp)$/i.test(formate))) return res.status(400).send({ status: false, message: "file must be an image(jpg,png,jpeg)" })

        if(requestArray.length==0) return res.status(400).send({status:false,msg:"body can not be empty"})
        if(files.length==0) return res.status(400).send({status:false,msg:"Enter profile image"});
   
        //For required  fields 
        for(let i=0;i<requiredFieldOfRequestArray.length;i++){ 
             if(!requestArray.includes(requiredFieldOfRequestArray[i])) 
             return res.status(400).send({status:false,msg:requiredFieldOfRequestArray[i] +" is required"})
         }
        //For valid input Data type    
         for(let j=0;j<valuesOfData.length;j++) {
                if(!isValid(valuesOfData[j]))return res.status(400).send({status:false,msg:`${requiredFieldOfRequestArray[j]} can not be undefined`})
                if(!isValidString(valuesOfData[j]))return res.status(400).send({status:false,msg:`${requiredFieldOfRequestArray[j]} can not be empty`})
         } 
        
        //for address
         let requestArrayOfAddress=Object.keys(data.address)
  
        if(typeof data.address !="object") return res.status(400).send({status:false,msg:"address must be in object form"})
        if(!requestArrayOfAddress.includes("shipping"))return res.status(400).send({status:false,msg:"shipping address is required"})
        if(!requestArrayOfAddress.includes("billing"))return res.status(400).send({status:false,msg:"billing address is required"})
        if(typeof data.address.shipping !="object") return res.status(400).send({status:false,msg:"address must be in object form"}) 
        if(typeof data.address.billing !="object") return res.status(400).send({status:false,msg:"address must be in object form"}) 

        //For required  fields of Address object
        let requiredFieldOfAddressArray=[ "street","city","pincode"]
        for (let j = 0; j < requiredFieldOfAddressArray.length; j++) {
            let shippingAddress = Object.keys(data.address.shipping)
            let billingAddress = Object.keys(data.address.billing)

            if (!billingAddress.includes(requiredFieldOfAddressArray[j]))
                return res.status(400).send({ status: false, msg: 'Enter ' + requiredFieldOfAddressArray[j] + " in billing address" })
            if (!shippingAddress.includes(requiredFieldOfAddressArray[j]))
                return res.status(400).send({ status: false, msg: 'Enter ' + requiredFieldOfAddressArray[j] + " in shipping address" })
        }
             //For valid input Data type of Address fields 
        for (let k = 0; k < requiredFieldOfAddressArray.length; k++) {
            const { street, city, pincode } = data.address.billing
            const valueOfBillingAddress = [street, city, pincode]

            if (!isValid(valueOfBillingAddress[k].trim())) return res.status(400).send({ status: false, msg: `${requiredFieldOfAddressArray[k]} can not be undefined` })
            if (!isValidString(valueOfBillingAddress[k].trim())) return res.status(400).send({ status: false, msg: `${requiredFieldOfAddressArray[k]} can not be empty in Billing` })
        }

        for (let l = 0; l < requiredFieldOfAddressArray.length; l++) {
            const { street, city, pincode } = data.address.billing
            const valueOfShippingAddress = [street, city, pincode]

            if (!isValid(valueOfShippingAddress[l].trim())) return res.status(400).send({ status: false, msg: `${requiredFieldOfAddressArray[l]} can not be undefined` })
            if (!isValidString(valueOfShippingAddress[l].trim())) return res.status(400).send({ status: false, msg: `${requiredFieldOfAddressArray[l]} can not be empty in shipping` })
        }

        if (!validator.isAlpha(fname.trim())) return res.status(400).send({ status: false, msg: 'fname must be between a-z or A-Z' });
        if (!validator.isAlpha(lname.trim())) return res.status(400).send({ status: false, msg: 'lname must be between a-z or A-Z' });
       
        if (!validator.isAlpha(address.billing.city.trim())) return res.status(400).send({ status: false, msg: 'city name in billing must be between a-z or A-Z' });
        if (!validator.isAlpha(address.shipping.city.trim())) return res.status(400).send({ status: false, msg: 'city name in shipping must be between a-z or A-Z' });

        if (!isEmail(email.trim())) return res.status(400).send({ status: false, msg: 'email must be a valid email address' });
        if (password.length < 8 || password.length >15) return res.status(400).send({ status: false, msg: 'password must be at least 8 characters long and should be less than 15 characters' });
        if (!validPassword(password)) return res.status(400).send({ status: false, msg: "Enter valid password it should contain one capital letter and one special character(@#$%&*!)  " });

        if (!validateMobile(phone.trim())) return res.status(400).send({ status: false, msg: "must be valid mobile number" });
        if (!validPinCode(address.billing.pincode.trim())) return res.status(400).send({ status: false, msg: "Enter valid pin code billing address" });
        if (!validPinCode(address.shipping.pincode.trim())) return res.status(400).send({ status: false, msg: "Enter valid pin code in shipping address" });

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
        else { res.status(400).send({ msg: "Enter profile image" }) }

        let userData = await userModel.create(data);
        return res.status(201).send({ status: true, message: "User created successfully", data: userData })
    } catch (error) {
    console.log(error);
        return res.status(500).send({status:false, message:error.message});
    } 
};


//postlogin and jwt creation
const login = async function (req, res) {
    try {
        //if user deleted not allow login
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
    try {
        userId = req.params.userId
       
        const profile = await userModel.findById(userId)
        if (profile == null) {
            return res.status(404).send({ status: false, message: "userProfile not found" })
        }
        else return res.status(200).send({ status: true, message: "User profile details", data: profile })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
};


const updateData = async function (req, res) {
    try {
        let data = req.body
        const userId = req.params.userId
        const files = req.files
        console.log(files);
       
        let userdata = await userModel.findOne({ _id: userId }).select({ _id: 0, updatedAt: 0, createdAt: 0, __v: 0 }).lean();

        if (data.fname) {
            if (!validator.isAlpha(data.fname)) return res.status(400).send({ status: false, msg: 'fname must be between a-z or A-Z' })
            userdata.fname = data.fname
        }

        if (data.lname) {
            if (!validator.isAlpha(data.lname)) return res.status(400).send({ status: false, msg: 'lname must be between a-z or A-Z' })
            userdata.lname = data.lname
        } 
        if (data.password) {
            if (data.password.length < 8 || data.password.length > 15) return res.status(400).send({ status: false, msg: 'password must be at least 8 characters long and should be less than 15 characters' })
            if (!validPassword(data.password)) return res.status(400).send({ status: false, msg: "Enter valid password it should contain one capital letter and one special character(@#$%&*!)  " });
            const saltRounds = 10;
            const hash = bcrypt.hashSync(data.password, saltRounds);
            userdata.password = hash
        }

        if (data.address) {
            if (data.address.billing) {
                if (data.address.billing.city) {
                    if (!validator.isAlpha(data.address.billing.city)) return res.status(400).send({ status: false, msg: 'city name in billing must be between a-z or A-Z' })
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
                    if (!validator.isAlpha(data.address.shipping.city)) return res.status(400).send({ status: false, msg: 'city name in shipping must be between a-z or A-Z' })
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
            userdata.email = data.email
            //check for uniqueness 
        }
        if (data.phone) {
            if (!validateMobile(data.phone)) return res.status(400).send({ status: false, msg: "must be valid mobile number" });
            //check for uniqueness 
        }
        if (files.length>0) {
            let formate = files[0].originalname
            if (!(/\.(jpe?g|png|bmp)$/i.test(formate))) return res.status(400).send({ status: false, message: "file must be an image(jpg,png,jpeg)" })
                let uploadedFileURL = await uploadFile(files[0])
                userdata.profileImage = uploadedFileURL
           }
        

        let updatedData = await userModel.findOneAndUpdate({ _id: userId }, { $set: userdata }, { new: true });
        return res.status(200).send({ status: true, message: updatedData })

    } catch (err) {
        console.log(err)
        return res.status(500).send({ error: err.message })
    }
}






module.exports = { createUser, getUserProfile, login, updateData } 
