const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const youtubeRoutes = require("./routes/youtubeRoutes");
const bodyParser = require('body-parser');
const app = express();



// Set up view engine and parsers
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..', 'views'));

// For parsing application/json
app.use(bodyParser.json());

// For parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Use routes
app.use(youtubeRoutes);

module.exports = app;
