var map = require('map-stream');
var util = require('util');
var path = require('path');
var table = require('text-table');
var f = require('sprintf-js').sprintf;
var chalk = require('chalk');
var plur = require('plur');
var symb = require('log-symbols');
var extend = require('extend');
var strLen = require('string-length');

function log(output, opts) {
  var stats = opts.stats;
  var symbol = (opts.symbol) ? opts.symbol : symb[opts.type];

  var patternFileCount = '%' + ('' + stats.files.total).length + 'd';
  var patternProblemCount = '%' + ('' + stats.problems.total).length + 'd';

  var patternFiles = '  %s  ' + patternFileCount + ' %s %s';
  var patternFilePct = '(%5.2f%%)';
  var patternProblems = '     %s  ' + patternProblemCount + ' %s total';

  var files = stats.files[opts.type];
  var filePct = stats.files[opts.type + 'Pct'];
  var problems = stats.problems[opts.type];

  if (stats.files[opts.type] > 0) {
    output.push([
      f(patternFiles, symbol, files, plur('file', files), opts.desc),
      (!opts.showFilePct) ? '' :
        f(patternFilePct, filePct),
      (!opts.showProblems) ? '' :
        f(patternProblems, symbol, problems, plur(opts.type, problems))
    ]);
  }
}

function pct(i, n) {
  return i / n * 100;
}

function statistics(results, config) {
  var problemCounts = { 'I': 0, 'W': 0, 'E': 0 };
  var problemFiles  = { 'I': new Set(), 'W': new Set(), 'E': new Set() };
  var successFiles  = new Set();

  config.map(function(conf) {
    successFiles.add(conf.file);
  });

  results.map(function(result) {
    problemCounts[result.error.code[0]]++;
    problemFiles[result.error.code[0]].add(result.file);
    successFiles.delete(result.file);
  });

  var stats = { files: {}, problems: {} };
  stats.files.total   = config.length;
  stats.files.success = successFiles.size;
  stats.files.warning = problemFiles['I'].size + problemFiles['W'].size;
  stats.files.error   = problemFiles['E'].size;
  stats.files.problem = stats.files.total - stats.files.success;
  stats.files.successPct = pct(stats.files.success, stats.files.total);
  stats.files.warningPct = pct(stats.files.warning, stats.files.total);
  stats.files.errorPct   = pct(stats.files.error,   stats.files.total);
  stats.files.problemPct = pct(stats.files.problem, stats.files.total);
  stats.problems.warning = problemCounts['I'] + problemCounts['W'];
  stats.problems.error   = problemCounts['E'];
  stats.problems.total   = stats.problems.warning + stats.problems.error;

  return stats;
}

function reporter(results, config, opts) {
  var options = extend({}, {
    showSummaryOnSuccess: false,
    showSummaryHeader: false,
    showWarningTotals: false,
    showErrorTotals: false,
    print: console.log
  }, opts);

  var stats = statistics(results, config);

  if (stats.files.problem === 0 && !options.showSummaryOnSuccess) {
    return;
  }
  var tableOutput = [];
  log(tableOutput, {
    stats: stats,
    symbol: symb.info,
    type: 'total',
    desc: 'checked',
    showFilePct: false,
    showProblems: false
  });
  log(tableOutput, {
    stats: stats,
    type: 'success',
    desc: 'without problems',
    showFilePct: true,
    showProblems: false
  });
  log(tableOutput, {
    stats: stats,
    type: 'warning',
    desc: 'with warnings',
    showFilePct: true,
    showProblems: options.showWarningTotals
  });
  log(tableOutput, {
    stats: stats,
    type: 'error',
    desc: 'with errors',
    showFilePct: true,
    showProblems: options.showErrorTotals
  });

  var output = '';
  if (options.showSummaryHeader) {
    var header = (options.summaryHeader) ? options.summaryHeader :
      'SUMMARY' + ((options.stat) ? ': ' + options.stat : '');
    output += '\n' + chalk.inverse(' ' + header + ' ') + '\n\n';
  }
  output += table(tableOutput, {
    hsep: '   ',
    stringLength: strLen
  });
  options.print(output + '\n');
}

function parseArguments(args) {
  var opts = { };
  if (args.length === 1) {
    if (util.isString(args[0])) {
      opts = { stat: args[0] };
    } else {
      opts = args[0];
    }
  } else if (args.length === 2) {
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

  this.collect = function() {
    var opts = parseArguments(arguments);
    return map(function(file, cb) {
      stats[opts.stat] = stats[opts.stat] || { results: [], config: [] };
      if (file.jshint.results) {
        file.jshint.results.map(function(result) {
          stats[opts.stat].results.push(result);
        });
      }
      if (file.jshint.data && file.jshint.data.length > 0) {
        stats[opts.stat].config.push(file.jshint.data[0]);
      } else {
        stats[opts.stat].config.push({
          file: path.relative(file.cwd, file.path)
        });
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
          showErrorTotals: true
        }, opts)
      );
    };
  };

  this.stats = function() {
    var opts = parseArguments(arguments);
    return statistics(stats[opts.stat].results, stats[opts.stat].config);
  };

  this.create = function() {
    return new JSHintStylishSummary();
  };

  this.toString = function() {
    return __filename;
  };
}

module.exports = new JSHintStylishSummary();
