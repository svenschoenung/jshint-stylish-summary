var jshintStylish  = require('jshint-stylish');
var jshintStylishSummary  = require('./index.js');

exports.reporter = function(results, data, opts) {
  jshintStylish.reporter(results, data, opts);
  jshintStylishSummary.reporter(results, data, opts);
};
