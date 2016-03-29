'use strict';

/* global describe:false, it:false */

var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;
var summary = require('./index.js');

var gulp = require('gulp');
var jshint = require('gulp-jshint');

function testCollect(glob, collect, cb) {
  gulp.src(glob)
    .pipe(jshint('test/.jshintrc'))
    .pipe(collect)
    .on('end', cb);
}

function testSummarize(glob, args, done) {
  var sum = summary.create();
  gulp.src(glob)
    .pipe(jshint('test/.jshintrc'))
    .pipe(sum.collect.apply(sum, args))
    .on('end', function() {
      sum.summarize.apply(sum, args)();
      if (done) {
        done();
      }
    });
}

describe('summary.create', function() {
  it('it should create a new summary object', function() {
    var obj1 = summary.create();
    var obj2 = summary.create();
    expect(obj1).to.be.an('object');
    expect(obj2).to.be.an('object');
    expect(obj1).to.not.equal(obj2);
  });
});

describe('summary.collect', function() {
  it('it should populate default statistics object', function(done) {
    testCollect('test/test1/*.js', summary.collect(), function() {
      var stats1 = summary.stats();
      expect(stats1.files.total).to.equal(3);
      expect(stats1.files.success).to.equal(1);
      expect(stats1.files.warning).to.equal(2);
      expect(stats1.files.error).to.equal(1);
      expect(stats1.files.problem).to.equal(2);
      expect(stats1.files.successPct).to.be.within(33.33, 33.34);
      expect(stats1.files.warningPct).to.be.within(66.66, 66.67);
      expect(stats1.files.errorPct).to.be.within(33.33, 33.34);
      expect(stats1.problems.warning).to.equal(3);
      expect(stats1.problems.error).to.equal(2);
      expect(stats1.problems.total).to.equal(5);
      testCollect('test/test2/*.js', summary.collect(), function() {
        var stats2 = summary.stats();
        expect(stats2.files.total).to.equal(6);
        expect(stats2.files.success).to.equal(2);
        expect(stats2.files.warning).to.equal(4);
        expect(stats2.files.error).to.equal(2);
        expect(stats2.files.problem).to.equal(4);
        expect(stats2.files.successPct).to.be.within(33.33, 33.34);
        expect(stats2.files.warningPct).to.be.within(66.66, 66.67);
        expect(stats2.files.errorPct).to.be.within(33.33, 33.34);
        expect(stats2.problems.warning).to.equal(6);
        expect(stats2.problems.error).to.equal(4);
        expect(stats2.problems.total).to.equal(10);
        done();
      });
    });
  });
  it('it should populate named statistics object', function(done) {
    testCollect('test/test1/*.js', summary.collect('stats1'), function() {
      var stats1 = summary.stats('stats1');
      expect(stats1.files.total).to.equal(3);
      expect(stats1.files.success).to.equal(1);
      expect(stats1.files.warning).to.equal(2);
      expect(stats1.files.error).to.equal(1);
      expect(stats1.files.problem).to.equal(2);
      expect(stats1.files.successPct).to.be.within(33.33, 33.34);
      expect(stats1.files.warningPct).to.be.within(66.66, 66.67);
      expect(stats1.files.errorPct).to.be.within(33.33, 33.34);
      expect(stats1.problems.warning).to.equal(3);
      expect(stats1.problems.error).to.equal(2);
      expect(stats1.problems.total).to.equal(5);
      testCollect('test/test1/*.js', summary.collect('stats2'), function() {
        var stats2 = summary.stats('stats2');
        expect(stats2.files.total).to.equal(3);
        expect(stats2.files.success).to.equal(1);
        expect(stats2.files.warning).to.equal(2);
        expect(stats2.files.error).to.equal(1);
        expect(stats2.files.problem).to.equal(2);
        expect(stats2.files.successPct).to.be.within(33.33, 33.34);
        expect(stats2.files.warningPct).to.be.within(66.66, 66.67);
        expect(stats2.files.errorPct).to.be.within(33.33, 33.34);
        expect(stats2.problems.warning).to.equal(3);
        expect(stats2.problems.error).to.equal(2);
        expect(stats2.problems.total).to.equal(5);
        done();
      });
    });
  });
});

describe('summary.summarize', function() {
  it('it should output summary', function(done) {
    testSummarize('test/test1/*.js', ['stat', {
      print: function(output) {
        expect(output).to.be.a('string');
        expect(output).to.match(/files? checked/);
        done();
      }
    }]);
  });
  it('it should honor stat option', function(done) {
    testSummarize('test/test1/*.js', [{
      stat: 'STATNAME',
      showSummaryOnSuccess: true,
      print: function(output) {
        expect(output).to.match(/SUMMARY: STATNAME/);
	done();
      }
    }]);
  });
  it('it should honor summaryHeader option', function(done) {
    testSummarize('test/test1/*.js', [{
      stat: 'STATNAME',
      summaryHeader: 'CUSTOM HEADER',
      showSummaryOnSuccess: true,
      print: function(output) {
        expect(output).to.match(/CUSTOM HEADER/);
        expect(output).to.not.match(/SUMMARY/);
	done();
      }
    }]);
  });
  it('it should honor showSummaryOnSuccess:true option', function(done) {
    testSummarize('test/test1/good.js', [{
      showSummaryOnSuccess: true,
      print: function(output) {
        expect(output).to.not.be.empty;
	done();
      }
    }]);
  });
  it('it should honor showSummaryOnSuccess:false option', function(done) {
    var spy = chai.spy();
    testSummarize('test/test1/good.js', [{
      showSummaryOnSuccess: false,
      print: spy
    }], function() {
      expect(spy).to.not.have.been.called();
      done();
    });
  });
  it('it should honor showSummaryHeader:true option', function(done) {
    testSummarize('test/test1/*.js', [{
      showSummaryHeader: true,
      print: function(output) {
        expect(output).to.match(/SUMMARY/);
	done();
      }
    }]);
  });
  it('it should honor showSummaryHeader:false option', function(done) {
    testSummarize('test/test1/*.js', [{
      showSummaryHeader: false,
      print: function(output) {
        expect(output).to.not.match(/SUMMARY/);
	done();
      }
    }]);
  });

});


describe('summary.toString', function() {
  it('it should return a string', function() {
    expect(summary.toString()).to.be.a('string');
  });
});
