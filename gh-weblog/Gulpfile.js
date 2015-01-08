var gulp = require('gulp');
var concat = require('gulp-concat');

/**
 * Browserify bundling only.
 */
gulp.task('browserify', function() {
  var browserify = require('browserify');
  var transform = require('vinyl-transform');
  var reactify = require('reactify');
  var source = require('vinyl-source-stream');

  // Don't process react/octokit, because we can "bundle"
  // those in far more efficiently at the cost of a global
  // variable for React and Octokit. "oh no"
  var donottouch = require('browserify-global-shim').configure({
    'react': 'React',
    'octokit': 'Octokit'
  });

  return browserify('./components/App.jsx')
    .transform(reactify)
    .transform(donottouch)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./build/'));
});

/**
 * Pack in the React and Octokit libraries, because this
 * saves about 200kb on the final minified version compared
 * to running both through browserify the usual way.
 */
gulp.task('enrich', ['browserify'], function() {
  return gulp.src([
     './bower_components/react/react.min.js',
     './bower_components/octokit/octokit.js',
     './build/bundle.js'
   ])
   .pipe(concat('enriched.js'))
   .pipe(gulp.dest('./build/'));
});

/**
 * Minify everything, using uglify.
 */
gulp.task('minify', ['enrich'], function() {
  var uglify = require('gulp-uglify');
  return gulp.src('./build/enriched.js')
   .pipe(concat('gh-weblog.js'))
   .pipe(uglify())
   .pipe(gulp.dest('./dist/'));
});

/**
 * our "default" task runs everything, but -crucially- it
 * runs the subtasks in order. That means we'll wait for
 * files to be written before we move on to the next task,
 * because in this case we can't run parallel tasks.
 */
gulp.task('default', ['minify'], function() {
  console.log("Finishing packing up.");
});
