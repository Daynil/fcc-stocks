'use strict';
let mongoose = require('mongoose');

let stockSchema = new mongoose.Schema({
  data: [{ date: String, price: Number }],
  symbol: String,
  name: String,
  newestDate: String,
  oldestDate: String,
  color: String
});

module.exports = mongoose.model('Stock', stockSchema);