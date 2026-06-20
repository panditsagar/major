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

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is missing in the environment`);
  }
}

let databaseConnection;

function connectDatabase() {
  if (!databaseConnection) {
    databaseConnection = mongoose
      .connect(dbUrl, { serverSelectionTimeoutMS: 5000 })
      .then(() => {
        console.log("connected to DB");
      })
      .catch((err) => {
        databaseConnection = undefined;
        throw err;
      });
  }

  return databaseConnection;
}

// Ensure the shared database connection is ready before handling a request.
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    next(err);
  }
});

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
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// Vercel invokes this exported Express application as a serverless function.
module.exports = app;

// Keep the normal local `npm start` workflow.
if (require.main === module) {
  const port = process.env.PORT || 8080;
  connectDatabase()
    .then(() => {
      app.listen(port, () => {
        console.log(`server is listening on port ${port}`);
      });
    })
    .catch((err) => {
      console.error("Failed to start server:", err.message);
      process.exitCode = 1;
    });
}
