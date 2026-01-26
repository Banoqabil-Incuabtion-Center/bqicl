import express from "express";
import dotenv from "dotenv";
import path from "path";
import indexroute from "./routes/indexRoute.js";
import auctionApiRouter from "./routes/auctionApiRouter.js";
import { fileURLToPath } from "url";
import "./config/config.js";
import session from 'express-session';
import flash from 'connect-flash';
import cookieParser from "cookie-parser";
import csrf from "csurf";
import { checkAuth } from "./middlewares/authMiddleware.js";
import currentPath from "./middlewares/currentPath.js"
import db from './models/index.js';



dotenv.config();

const app = express();

// 1. Basic Parsers (Must come first)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 2. Static Files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// 3. Initialize global auction state
if (typeof global.auctionActive === 'undefined') {
  global.auctionActive = false;
}

// 4. Session Setup (Must be before Flash and CSRF)
app.use(
  session({
    name: "ui.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    rolling: false,
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60 * 1000
    }
  })
);

// 5. Flash Messages & Local Variables (Depends on Session)
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  next();
});

// 6. Security & CSRF
const csrfProtection = csrf({ cookie: false });
app.use((req, res, next) => {
  // Exempt API from CSRF if using Bearer tokens, or handle specifically
  if (req.path.startsWith('/api/')) return next();
  csrfProtection(req, res, next);
});

app.use((req, res, next) => {
  if (req.csrfToken) {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
});

// 7. Global Auth Detection
app.use(checkAuth);

// 8. Custom Pathing & Views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(currentPath);
app.use("/", indexroute);
app.use("/api/auction", auctionApiRouter);

// 10. Error Handlers (Always last)
app.use((req, res, next) => {
  res.status(404).render('404', { title: '404 - Not Found' });
});

app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);

  if (err.code === "EBADCSRFTOKEN") {
    req.flash("error", "Form expired or invalid security token. Please try again.");
    const backURL = req.get("Referrer") || "/";
    return res.redirect(backURL);
  }

  const statusCode = err.status || 500;
  res.status(statusCode).render('error', {
    title: 'Error | AuctionPro',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong on our end.' : err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});


// (async () => {
//     try {
//         const team = await Team.findOne({
//             where: { id: 1 },
//             include: [{ model: Owner,
//               as: 'owner'
//              }] 
//         });

//         if (team) {

//           console.log(team.owner.toJSON());


//             if (team.owner) {
//                 console.log("Owner Name:", team.owner.name);
//                 console.log("Owner Email:", team.owner.email);
//             } else {
//                 console.log("This team has no owner assigned.");
//             }
//         } else {
//             console.log("Team not found!");
//         }
//     } catch (error) {
//         console.error("Error:", error);
//     }
// })();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
