const isValid= function(value){
    if (typeof value=== "undefined" || typeof value === "object") return false
    if(value==null)return false 
    return true
}
   
const isValidString=function(value){
    if (typeof value==="string" && value.trim().length===0 ) return false
    if(value.trim()=='"v"')return false
    return true   
    }

const validateMobile = function(number) {
    let trimMobile = number.trim()
    let  reg = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/
    return  reg.test(trimMobile) ;
    }

const validPinCode= function(value){
    let trimValue= value.trim() ;
    let reg=/^[1-9][0-9]{5}$/
    return reg.test(trimValue) 
    }

const isValidObjectId=function(id){
    const regexObjectID = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i
    return (regexObjectID.test(id))
    }

const validPassword = function checkPassword(password){
    var re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;
    return re.test(password);
    }
let availableSizes = ["S","XL"]
    const isValidSize =  (availableSizes) => {
        return ["S", "XS","M","X", "L","XXL", "XL"].indexOf(availableSizes) === -1
    }

module.exports = {isValid,isValidString,validateMobile,validPinCode,isValidObjectId,validPassword,isValidSize}

