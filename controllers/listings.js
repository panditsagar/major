const Listing = require("../models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index =async(req,res)=>{
    const allListings = await Listing.find({})
   res.render("./listings/index.ejs",{allListings})
}

module.exports.renderNewForm =(req,res)=>{
    res.render("listings/new.ejs")
 }

module.exports.showListing =async(req,res)=>{
    let {id} = req.params;
     const listing = await Listing.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");
     if(!listing){
       req.flash("error","Listing does not exist!")
       res.redirect("/listings")
     }
     res.render("listings/show.ejs",{listing})
 }

module.exports.createListing = async(req,res,next)=>{
  let response = await geocodingClient.forwardGeocode({
    query: req.body.listing.location ,
    limit: 1
  })
    .send()
      
    //let{title,description,image,price,country,location}=req.body;
     const newListing = new Listing(req.body.listing);
     newListing.owner = req.user._id;
     newListing.geometry = response.body.features[0].geometry;
     let save = await newListing.save();
     console.log(save)
     req.flash("success","New Listing Created!")
     res.redirect("/listings");
      
}

module.exports.editListing = async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
     req.flash("error","Listing does not exist!")
     res.redirect("/listings")
   }
    res.render("listings/edit.ejs",{listing});
  }

module.exports.updateListing = async(req,res)=>{
    let{id}= req.params;
   await Listing.findByIdAndUpdate(id,{...req.body.listing})
   req.flash("success","Listing updated!")
   res.redirect(`/listings/${id}`)
 }

 module.exports.deleteListing = async(req,res)=>{
    let{id}= req.params;
    let deleteLIsting = await Listing.findByIdAndDelete(id);
    console.log(deleteLIsting);
    req.flash("success"," Listing Deleted!")
 
    res.redirect("/listings");
  }