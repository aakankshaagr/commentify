require("dotenv").config();
const app = require('./src/app');
const port = process.env.PORT || 3000;

const express = require("express");

const cors = require("cors");

app.use(cors());
app.use(express.json());
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
