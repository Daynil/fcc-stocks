'use strict';
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compress = require('compression');
const axios = require('axios');

// Load local environment variables in development
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').load();
}
let production = process.env.NODE_ENV === 'production';

// Quandl specific
const apiKey = process.env.QUANDL_API_KEY;
const baseUrl = 'https://www.quandl.com/api/v3/datasets/WIKI/';

// DEBUG
//const fs = require('fs');
const aaplCache = require('./aaplCache.json');
const abbvCache = require('./abbvCache.json');
const cvsCache = require('./cvsCache.json');
const fbCache = require('./fbCache.json');

/** True = get response details on served node modules **/
let verboseLogging = false;

/** Gzip files in production **/
if (production) {
  app.use(compress());
}

app.use(bodyParser.json());

app.use(morgan('dev', {
  skip: (req, res) => {
    if (verboseLogging) return false;
    else return req.baseUrl === '/scripts';
  }
}));

app.use( express.static( path.join(__dirname, '../dist') ));

app.use('/scripts', express.static( path.join(__dirname, '../node_modules') ));
app.use('/app', express.static( path.join(__dirname, '../dist/app') ));

app.get('/api/getstockdata/:symbol', (req, res) => {
  let stockSym = req.params.symbol;
  if (stockSym === "FB") {
    res.status(200).json(fbCache);
  } else if (stockSym === "AAPL") {
    res.status(200).json(aaplCache);            
  } else if (stockSym === "CVS") {
    res.status(200).json(cvsCache);
  } else if (stockSym === "ABBV") {
    res.status(200).json(abbvCache);
  }
  else axios.get(`${baseUrl}${stockSym}.json?api_key=${apiKey}&start_date=2015-06-17`)
        .then(data => {
          res.status(200).json(data.data);
        })
        .catch(err => {
          console.log(err);
          res.status(500).send({ error: err });
        });
});

/** Pass all non-api routes to front-end router for handling **/ 
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
});

let port = process.env.PORT || 3000;
let server = app.listen(port, () => console.log(`Listening on port ${port}...`));