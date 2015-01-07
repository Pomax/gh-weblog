var gulp = require('gulp');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var reactify = require('reactify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');

var donottouch = require('browserify-global-shim').configure({
  'react': 'React',
  'octokit': 'Octokit'
});

gulp.task('default', function() {
  browserify('./components/App.jsx')
    .transform(reactify)
    .transform(donottouch)    
    .bundle()
    .pipe(source('gh-weblog.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./dist/'));
});
