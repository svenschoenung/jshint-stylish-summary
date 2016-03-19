'use strict';
var expect = require('chai').expect;
var summary = require('./index.js');

describe('summary.create', function() {
  it('it should create a summary object', function() {
    expect(summary.create()).to.be.an('object');
  });
});
