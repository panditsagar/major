if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const wrapAsync = require("./utils/wrapAsync.js");
const listingController = require("./controllers/listings.js");

const dbUrl = process.env.ATLASDB_URL;
const secret = process.env.SECRET;
const requiredEnv = [
  "ATLASDB_URL",
  "SECRET",
  "MAP_TOKEN",
  "CLOUD_NAME",
  "CLOUD_API_KEY",
  "CLOUD_API_SECRET",
];

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

async function startServer() {
  for (let key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`${key} is missing in .env`);
    }
  }

  await mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log("connection to DB");

  const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
      secret,
    },
    touchAfter: 24 * 3600,
  });

  store.on("error", (err) => {
    console.log("ERROR IN MONGO SESSION STORE", err);
  });

  const sessionOptions = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  };

  app.use(session(sessionOptions));
  app.use(flash());

  // Use passport after session middleware.
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy(User.authenticate()));
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
  });

  app.get("/", wrapAsync(listingController.index));
  app.use("/listings", listingsRouter);
  app.use("/listings/:id/reviews", reviewsRouter);
  app.use("/", userRouter);

  app.all("*", (req, res, next) => {
    next(new ExpressError(404, "page not found"));
  });

  app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Somthing went wrong" } = err;
    res.status(statusCode).render("error.ejs", { message });
  });

  app.listen(8080, () => {
    console.log("server is listening to port : 8080");
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
