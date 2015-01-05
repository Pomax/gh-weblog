var gulp = require('gulp');
var react = require('gulp-react');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var merge = require('merge-stream');

gulp.task('default', function () {

  // convert all JSX to plain form
  var components = gulp.src('components/*.jsx')
                       .pipe(react())
                       .pipe(gulp.dest('build'))
                       .pipe(concat('components.js'))
                       .pipe(gulp.dest('build'));

  // bundle all the mixins
  var mixins = gulp.src('mixins/*.js')
                   .pipe(concat('mixins.js'))
                   .pipe(gulp.dest('build'));

  // bundle the dependencies
  var dependencies = gulp.src([
                           'bower_components/octokit/octokit.js',
                           'bower_components/marked/lib/marked.js'
                          ])
                         .pipe(concat('dependencies.js'))
                         .pipe(gulp.dest('build'));

  // and finally, bundle everything into a single package
  merge(dependencies, components, mixins)
       .pipe(concat('gh-weblog.js'))
       .pipe(uglify())
       .pipe(gulp.dest('dist'));
});
