 if(process.env.NODE_ENV != "production"){
  require("dotenv").config();
}

const express= require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const { readdir } = require("fs");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js")
const session= require("express-session");
const MongoStore = require("connect-mongo")
const flash = require("connect-flash");
const passport= require("passport");
const LocalStrategy = require("passport-local")
const User = require("./models/user.js")
 
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js")
const { error } = require("console");
const { url } = require("inspector");

app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.use(express.urlencoded({extended:true})); 
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

//mongoose conection

const dbUrl = process.env.ATLASDB_URL
main()
 .then(()=>{
    console.log("connection to DB")
  })
 .catch((err)=>{
    console.log(err)
  })
async function main(){
    mongoose.connect(dbUrl);
}

const store = MongoStore.create({
  mongoUrl:dbUrl,
  crypto:{
    secret: process.env.SECRET,
  },
  touchAfter:24*3600,
})

store.on("error",()=>{
  console.log("ERROR IN MONGO SESSION STORE",err)
})

const sessionOptions = {
  store,
  secret:process.env.SECRET,
  resave : false,
  saveUninitialized:true,
  cookie:{
    expires:Date.now()+7*24*62*62*1000,
    maxAge:7*24*62*62*1000,
    httpOnly:true,
  }
}

// server express
// app.get("/",(req,res)=>{
//   res.send("Hey, I am root")
// })

app.use(session(sessionOptions));
app.use(flash());

//using passport "before using passport we use session"
app.use(passport.initialize()); 
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middleware for flash message
app.use((req,res,next)=>{
  res.locals.success = req.flash("success");
  res.locals.error=req.flash("error")
  res.locals.currUser = req.user;
  next();
})

// app.get("/demouser",async(req,res)=>{
//   let fakeUser = new User({
//     email:"sagar555@gmail.com",
//     username:"sagar-pandit"
//   })
//   let registerdUser= await User.register(fakeUser,"hello123")
//   res.send(registerdUser)
// })


app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews",reviewsRouter)
app.use("/",userRouter)
// app.get("/testListing",async(req,res)=>{
// let sampleListing = new Listing({
//     title:"my new villa",
//     description:"by the beach",
//     price:1200,
//     location:"calangute, Goa",
//     country:"India"
// });
//   await sampleListing.save();
//   console.log("smple was sava")
//   res.send("successful testing")
// })

app.all("*",(req,res,next)=>{
  next(new ExpressError(404, "page not found"))

})

//middleware
app.use((err,req,res,next)=>{
   let {statusCode=500,message="Somthing went wrong"} = err;
  //  res.status(statusCode).send(message);
  res.status(statusCode).render("error.ejs",{message })
})
 

app.listen(8080,()=>{
    console.log("server is listening to port : 8080")
}) 