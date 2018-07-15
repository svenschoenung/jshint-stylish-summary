var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jshintSummary = require('./index.js');

gulp.task('default', function() {
  return gulp.src('test/**/*.js')
    .pipe(jshint('test/.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshintSummary.collect())
    .on('end', jshintSummary.summarize());
});
