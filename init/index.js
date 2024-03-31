const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js")

main()
 .then(()=>{
    console.log("connection to DB")
  })
 .catch((err)=>{
    console.log(err)
  })
async function main(){
    mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

const initDB = async ()=>{
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj)=>({...obj,owner:"65fb2018aa4fcb0c61cf2f90" }))
    await Listing.insertMany(initData.data)
    console.log("data was init")
} 
initDB();