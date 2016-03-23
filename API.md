# API

## Default instance

A default instance of jshint-stylish-summary can be acquired by calling `require('jshint-stylish-summary')`.

Remember that Node.js caches return values of `require` so statistics collected using the default instance will be visible everywhere. Use [`create()`](#create) to create additional instances.

## create()

Creates a new jshint-stylish-summary instance. This allows to collect multiple statistics using different instances.

**Example**

```js
gulp.task('lint', function() {
  var clientSummary = jshintSummary.create();
  var serverSummary = jshintSummary.create();
  var clientStream = gulp.src('src/client/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(clientSummary.collect())
  var serverStream = gulp.src('src/server/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(serverSummary.collect())
  return merge(clientStream, serverStream)
    .on('end', clientSummary.summarize())
    .on('end', serverSummary.summarize());
});
```

## collect([stat])

Returns a [`stream.Transform`](https://nodejs.org/api/stream.html#stream_class_stream_transform) object that can be passed to [`stream.pipe()`](https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options). Collects statistics of jshint results for all the files passing through the `stream`.

Optionally takes a `string` parameter `stat` which allows to collect multiple statistics under different names using the same jshint-stylish-summary instance.

**Example**

```js
gulp.task('lint', function() {
  var clientStream = gulp.src('src/client/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshintSummary.collect('client'))
  var serverStream = gulp.src('src/server/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshintSummary.collect('server'))
  return merge(clientStream, serverStream)
    .on('end', jshintSummary.summarize('client'))
    .on('end', jshintSummary.summarize('server'));
});
```

## summarize([stat[, options]]), summarize([options])

Returns a function that prints a summary for a collected statistic.

When called with no parameters a summary for the default statistic is printed.

Optionally takes the name `stat` of a statistic that was collected with [`collect()`](#collectstat) and prints that statistic.

Optionally takes an `options` object to influence aspects of the printed summary.

**Example**

 ```js
gulp.task('lint', function() {
  var clientStream = gulp.src('src/client/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshintSummary.collect('client'))
  var serverStream = gulp.src('src/server/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshintSummary.collect('server'))
  return merge(clientStream, serverStream)
    .on('end', jshintSummary.summarize({
      stat: 'client',
      showWarningTotals: false,
      showErrorTotals: false
    }))
    .on('end', jshintSummary.summarize('server', {
      showWarningTotals: false,
      showErrorTotals: false
    }));
});
```

### options

- `stat`: Name of the statistic to be printed. Same as providing `stat` as the first parameter to `summarize()`. (Optional.)
- `showSummaryOnSuccess`: Whether to print anything at all when no warnings or errors have been detected. (Defaults to `true`.)
- `showSummaryHeader`: Whether to print a header that sets the summary off from previous output. (Defaults to `true`.)
- `showWarningTotals`: Whether to print the total number of all generated warnings. (Defaults to `true`.)
- `showErrorTotals`: Whether to print the total number of all detected errors. (Defaults to `true`.)

## stats([stat])

Returns an object with the collected statistics information.

When called with no parameters returns the one for the default statistic.

Optionally takes the name `stat` of a particular statistic and returns that statistic.

```js
gulp.task('lint', function() {
  var clientStream = gulp.src('src/client/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshintSummary.collect('client'))
  var serverStream = gulp.src('src/server/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshintSummary.collect('server'))
  return merge(clientStream, serverStream)
    .on('end', function {
       var stats = jshintSummary.stats('client');
       console.log('Found ' + stats.problems.total +
            ' problems in ' + stats.files.total + ' client files');
    }))
    .on('end', function {
       var stats = jshintSummary.stats('server');
       console.log('Found ' + stats.problems.total +
            ' problems in ' + stats.files.total + ' server files');
    }))
});
```

**Returned object**

The returned object provides the following fields:

- `.files.total`: number of files that were linted
- `.files.success`: number of files where no warnings or errors were raised
- `.files.warning`: number of files where at least one warning was raised
- `.files.error`: number of files where at least one error was raised
- `.files.problem`: number of files where at least one warning or error was raised
- `.files.successPct`: percentage of files where no problems where found
- `.files.warningPct`: percentage of files where at least one warning was raised
- `.files.errorPct`: percentage of files where at least one error was raised
- `.files.problemPct`: percentage of files at least one warning or error was raised
- `.problems.warning`: overall number of warnings that were raised
- `.problems.error`: overall number of errors that were raised
- `.problems.total`: overall number of warnings and errors that were raised

## reporter(result, config, options)

Implementation of the [reporter interface](http://jshint.com/docs/reporters/) of jshint.

This is the function that is called when using the jshint CLI or JavaScript API. It is not usually called directly when using jshint-stylish-summary with gulp-jshint. Instead when using gulp-jshint call [`summarize()`](#summarizestat-options-summarizeoptions) which in turn calls `reporter()`.

### options

For available `options` see [`summarize()`](#summarizestat-options-summarizeoptions). Note that the default values for certain options are different when `reporter()` is called directly instead of through `summarize()`:

- `showSummaryOnSuccess` defaults to `false`
- `showSummaryHeader` defaults to `false`
- `showWarningTotals` defaults to `false`
- `showErrorTotals` defaults to `false`
