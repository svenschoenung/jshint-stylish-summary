var map = require('map-stream');
var util = require('util');
var path = require('path');
var table = require('text-table');
var f = require('sprintf-js').sprintf;
var chalk = require('chalk');
var plur = require('plur');
var symb = require('log-symbols');
var extend = require('extend');

function reporter(results, config, options) { 
  options = extend({}, {
    showSummaryOnSuccess: false,
    showSummaryHeader: false,
    showWarningTotals: false,
    showErrorTotals: false,
  }, options);

  var errorCounts  = { 'I': 0, 'W': 0, 'E': 0 };
  var errorFiles   = { 'I': new Set(), 'W': new Set(), 'E': new Set() }; 
  var successFiles = new Set();

  config.map(function(conf) {
    successFiles.add(conf.file);
  });

  results.map(function(result) {
    errorCounts[result.error.code[0]]++; 
    errorFiles[result.error.code[0]].add(result.file);
    successFiles.delete(result.file);
  });

  var totalFileCount   = config.length;
  var successFileCount = successFiles.size;
  var warningFileCount = errorFiles['I'].size + errorFiles['W'].size;
  var errorFileCount   = errorFiles['E'].size;

  var successPercentage = successFileCount / totalFileCount * 100;
  var warningPercentage = warningFileCount / totalFileCount * 100;
  var errorPercentage   = errorFileCount / totalFileCount * 100;

  var warningCount = errorCounts['I'] + errorCounts['W'];
  var errorCount = errorCounts['E'];

  var maxFileDigits = (''+totalFileCount).length
  var fd = '%' + maxFileDigits + 'd';
  var maxProblemDigits = (''+Math.max(errorCount, warningCount)).length
  var pd = '%' + maxProblemDigits + 'd';

  if (successFileCount == totalFileCount && !options.showSummaryOnSuccess) {
    return;
  }
  if (options.showSummaryHeader) {
    console.log(chalk.inverse('\n SUMMARY \n'))
  }
  var output = [[
    f('  %s  ' + fd + ' %s checked',
      symb.info, totalFileCount, plur('file', totalFileCount)),
  ]];
  if (successFileCount > 0) {
    output.push([
      f('  %s  ' + fd + ' %s without problems',
       symb.success, successFileCount, plur('file', successFileCount)),
      f('(%5.2f%%)',
        successPercentage)
    ]);
  }
  if (warningFileCount > 0) {
    output.push([
      f('  %s  ' + fd + ' %s with warnings',
        symb.warning, warningFileCount, plur('file', warningFileCount)),
      f('(%5.2f%%)',
        warningPercentage),
      (!options.showWarningTotals) ? '' :
        f('     %s  ' + pd + ' %s total',
          symb.warning, warningCount, plur('warning', warningCount)),
    ]);
  }
  if (errorFileCount > 0) {
    output.push([
      f('  %s  ' + fd + ' %s with errors',
        symb.error, errorFileCount, plur('file', errorFileCount)),
      f('(%5.2f%%)',
        errorPercentage),
      (!options.showErrorTotals) ? '' :
        f('     %s  ' + pd + ' %s total',
          symb.error, errorCount, plur('error', errorCount)),
    ]);
  }
  console.log(table(output, {
    hsep: '   ',
    stringLength: require('string-length'),
  }) + '\n');
}

function parseArguments(args) {
  var opts = { };
  if (args.length == 1) {
    if (util.isString(args[0])) {
      opts = { stat: args[0] };
    } else {
      opts = args[0];
    }
  } else if (args.length == 2) {
    opts = args[1];
    opts.stat = args[0];
  }
  if (!opts.stat) {
    opts.stat =  null;
  }
  return opts;
}

function JSHintStylishSummary() {
  var stats = {};

  this.reporter = reporter;

  this.collect = function(stat) {
    var opts = parseArguments(arguments);
    return map(function(file, cb) {
      stats[opts.stat] = stats[opts.stat] || { results: [], config: [] };
      if (file.jshint.success) {
        stats[opts.stat].config.push({
          file: path.relative(file.cwd, file.path),
        });
      } else {
        for (var i in file.jshint.results) {
          stats[opts.stat].results.push(file.jshint.results[i]);
        }
        stats[opts.stat].config.push(file.jshint.data[0]);
      }
      cb(null, file);
    });
  };

  this.summarize = function() {
    var opts = parseArguments(arguments);
    return function() {
      reporter(
	stats[opts.stat].results,
       	stats[opts.stat].config,
       	extend({}, {
          showSummaryOnSuccess: true,
          showSummaryHeader: true,
          showWarningTotals: true,
          showErrorTotals: true,
        }, opts)
      );
    };
   };

   this.create = function() {
     return new JSHintStylishSummary();
   };

   this.toString = function() {
     return __filename;
   }
}

module.exports = new JSHintStylishSummary();
