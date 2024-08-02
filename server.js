const express = require('express');
const routes = require('./routes/index');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
