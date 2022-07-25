const isValid= function(value){
    if (typeof value=== "undefined" || typeof value === "object") return false
   
    if(value==null)return false 
    return true
}
const isValidString=function(value){
    if (typeof value==="string" && value.trim().length===0) return false
     return true   
    }

module.exports = {isValid,isValidString}
