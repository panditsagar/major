const express= require("express");
const router= express.Router();
const wrapAsync = require("../utils/wrapAsync.js")
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner,validateListing} = require("../middleware.js")
const listingcontroller = require("../controllers/listings.js")

const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({storage});
 

router.route("/")
.get(wrapAsync(listingcontroller.index))
.post(isLoggedIn,validateListing,wrapAsync(listingcontroller.createListing));
// .post(upload.single("listing[image]"),(req,res)=>{
//     res.send(req.file);
// })

//new route
router.get("/new",isLoggedIn, listingcontroller.renderNewForm);
   
router.route("/:id")
.put(isLoggedIn,isOwner,validateListing,wrapAsync(listingcontroller.updateListing))
.get(wrapAsync(listingcontroller.showListing)) 
.delete(isLoggedIn,isOwner,wrapAsync(listingcontroller.deleteListing));


//edit route
router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(listingcontroller.editListing));
 

module.exports=router;