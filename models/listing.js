const mongoose = require("mongoose");
const Review = require("./review.js");
const { string } = require("joi");
const Schema = mongoose.Schema;

const listingSchema= new Schema({
    title:{
        type:String,
        required:true,
    } ,
    description:String,
    image:{
        type:String,
        default:"https://static.toiimg.com/img/104753278/Master.jpg",
        set:(v)=> 
        v === "" ? "https://static.toiimg.com/img/104753278/Master.jpg"
        : v,
    },
    price:Number,
    location: String,
    country: String,
    reviews:[{
        type:Schema.Types.ObjectId,
        ref:"Review"
    }],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    geometry:{
        type:{
            type:String,
            enum:["Point"],
            required:true
        },
        coordinates:{
            type:[Number],
            required:true
        },
    },
});

listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
  await Review.deleteMany({ _id: {$in: listing.reviews}})
}
})

const Listing = mongoose.model("Listing",listingSchema);
module.exports = Listing; 