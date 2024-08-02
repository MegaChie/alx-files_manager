const express = require('express');
const routes = require('./routes/index'); // Adjust path if necessary
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use('/', routes); // Make sure routes is a valid router

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
