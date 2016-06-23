'use strict';
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
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

// Database
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);
const Stocks = require('./stocks');

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

app.get('/api/getexistingstocks', (req, res) => {
  Stocks
    .find({})
    .exec()
    .then(results => {
      res.status(200).send(results);
    })
    .catch(err => {
      console.log('get stocks err: ', err);
      res.status(500).send(err);
    });
})

app.get('/api/getstockdata/:symbol', (req, res) => {
  let stockSym = req.params.symbol;

  axios.get(`${baseUrl}${stockSym}.json?api_key=${apiKey}&start_date=2015-06-17`)
        .then(data => {
          res.status(200).json(data.data);
        })
        .catch(err => {
          console.log(err);
          res.status(500).send({ error: err });
        });
});

io.on('connection', socket => {
  socket.on('newStock', stock => {
    Stocks
      .findOne({symbol: stock.symbol})
      .exec()
      .then(result => {
        if (result === null) {
          let newStock = new Stocks({
            data: stock.data,
            symbol: stock.symbol,
            name: stock.name,
            newestDate: stock.newestDate,
            oldestDate: stock.oldestDate,
            color: stock.color
          });
          newStock.save(err => {
            if (err) console.log('saveError: ', err);
          });
        }
      });
    socket.broadcast.emit('pushStock', stock);
  });

  socket.on('removeStock', stock => {
    Stocks
      .remove({ symbol: stock.symbol }, err => {
        if (err) console.log(err);
      });
    socket.broadcast.emit('sliceStock', stock);
  })
});

/** Pass all non-api routes to front-end router for handling **/ 
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
});

let port = process.env.PORT || 3000;
let server = http.listen(port, () => console.log(`Listening on port ${port}...`));