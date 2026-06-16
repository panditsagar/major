const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

async function geocodeLocation(location) {
  try {
    let response = await geocodingClient.forwardGeocode({
      query: location,
      limit: 1,
    }).send();

    if (!response.body.features.length) {
      throw new ExpressError(400, "Invalid listing location");
    }

    return response.body.features[0].geometry;
  } catch (err) {
    if (err.message && err.message.includes("Invalid Token")) {
      throw new ExpressError(401, "Invalid Mapbox token. Please update MAP_TOKEN in .env.");
    }
    throw err;
  }
}

module.exports.index =async(req,res)=>{
    const allListings = await Listing.find({})
   res.render("./listings/index.ejs",{allListings, searchQuery: ""})
}

module.exports.searchListings = async(req,res)=>{
   const searchQuery = (req.query.q || "").trim();
   if (!searchQuery) {
     if (req.query.format === "json") {
       const allListings = await Listing.find({});
       return res.json({listings: allListings});
     }
     return res.redirect("/listings");
   }

   const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
   const searchRegex = new RegExp(escapedQuery, "i");
   const allListings = await Listing.find({
     $or: [
       {title: searchRegex},
       {location: searchRegex},
       {country: searchRegex},
     ],
   });

   if (req.query.format === "json") {
     return res.json({listings: allListings});
   }

   res.render("./listings/index.ejs",{allListings, searchQuery})
}

module.exports.renderNewForm =(req,res)=>{
    res.render("listings/new.ejs")
 }

module.exports.showListing =async(req,res)=>{
    let {id} = req.params;
     const listing = await Listing.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");
     if(!listing){
       req.flash("error","Listing does not exist!")
       return res.redirect("/listings")
     }
     res.render("listings/show.ejs",{listing})
 }

module.exports.createListing = async(req,res,next)=>{
    //let{title,description,image,price,country,location}=req.body;
     const newListing = new Listing(req.body.listing);
     newListing.owner = req.user._id;
     newListing.geometry = await geocodeLocation(req.body.listing.location);
     if (req.file) {
       newListing.image = req.file.path;
     }
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
     return res.redirect("/listings")
   }
    res.render("listings/edit.ejs",{listing});
  }

module.exports.updateListing = async(req,res)=>{
    let{id}= req.params;
   let updateData = {...req.body.listing};
   if (req.file) {
    updateData.image = req.file.path;
   }
   if (req.body.listing.location) {
    updateData.geometry = await geocodeLocation(req.body.listing.location);
   }
   await Listing.findByIdAndUpdate(id, updateData, {runValidators: true})
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
