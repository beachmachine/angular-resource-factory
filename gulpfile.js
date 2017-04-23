'use strict';
/**
 * Gulp file for compiling library.
 *
 * - gulp build
 *   Builds the library under the configured dist folder
 * - gulp run-tests
 *   Runs the test suite of the library
 * - gulp watch
 *   Watches for changes in the sources and triggers a build
 * - gulp clean
 *   Cleans all auto generated files
 */

/*
 * Gulp file configuration
 */
var
    config = {
        'dist': 'dist',
        'src': [
            'src/index.js',
            'src/**/*.js'
        ],
        'documentationSources': './src',
        'documentationDir': './dist/doc',
        'testSources': [
            './node_modules/angular/angular.js',
            './node_modules/angular-mocks/angular-mocks.js',
            './node_modules/angular-resource/angular-resource.js',
            './dist/ngresourcefactory.js',
            './tests/**/test*.js'
        ],
        'moduleLicenseDir': 'MODULE_LICENSES',
        'moduleConfig': {
            'name' : 'ngresourcefactory',
            'deps': [
                'angular'
            ],
            'args': [
                'angular'
            ],
            'exports': 'angular.module("ngResourceFactory")',
            'type': 'umd'
        }
    };

/*
 * Gulp module imports
 */
var
    // Gulp modules
    gulp = require('gulp'),
    gulpPlumber = require('gulp-plumber'),
    gulpUtil = require('gulp-util'),
    gulpUglify = require('gulp-uglify'),
    gulpSequence = require('gulp-sequence'),
    gulpClean = require('gulp-clean'),
    gulpConcat = require('gulp-concat'),
    gulpWatch = require('gulp-watch'),
    gulpConvertNewline = require('gulp-convert-newline'),
    gulpStripDebug = require('gulp-strip-debug'),
    gulpNgAnnotate = require('gulp-ng-annotate'),
    gulpModuleWrapper = require('gulp-module-wrapper'),
    gulpKarmaRunner = require('gulp-karma-runner'),
    gulpExit = require('gulp-exit'),

    // Other modules
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    childProcess = require('child_process'),
    licenseChecker = require('license-checker');


/*
 * Environment variables
 */
var
    production = !!gulpUtil.env.production;


/**
 * Watches for changes and builds the library for distribution
 */
gulp.task('watch', function () {
    gulp.start('build');
    gulpWatch([config.src], function () {
        gulp.start('build');
    });
});


/**
 * Runs the test suite
 */
gulp.task('run-tests', ['build'], function () {
    return gulp.src(config.testSources, {'read': false})
        .pipe(gulpKarmaRunner.server({
            'frameworks': ['jasmine'],
            'reporters': ['verbose'],
            'browsers': ['PhantomJS'],
            'singleRun': true,
            'showStack': false,
            'autoWatch': false
        }))
        .pipe(gulpExit());
});


/**
 * Builds the library for distribution
 */
gulp.task('build', function (cb) {
    return gulpSequence(['module-licenses', 'scripts-js', 'docs'], cb);
});


/**
 * Builds the javascript sources
 */
gulp.task('scripts-js', function () {
    return gulp.src(config.src)
        .pipe(gulpPlumber())
        // ng annotate
        .pipe(gulpNgAnnotate({ 'add': true, 'remove': false, 'single_quotes': true }))
        // remove logging
        .pipe(production ? gulpStripDebug() : gulpUtil.noop())
        // merge to one file
        .pipe(gulpConcat(production ? config.moduleConfig.name + '.min.js' : config.moduleConfig.name + '.js'))
        // wrap in node module
        .pipe(gulpModuleWrapper(config.moduleConfig))
        // minify js
        .pipe(production ? gulpUglify({ 'mangle': false }) : gulpUtil.noop())
        // write compiled js
        .pipe(gulp.dest(config.dist));
});


/**
 * Builds the documentation
 */
gulp.task('docs', function (cb) {
    childProcess.exec(
        'node_modules/jsdoc/jsdoc.js '+
        '--configure node_modules/angular-jsdoc/common/conf.json '+ // config file
        '--template node_modules/angular-jsdoc/default '+ // template file
        '--destination "' + config.documentationDir + '" '+ // output directory
        '--readme ./README.md ' + // to include README.md as index contents
        '--recurse "' + config.documentationSources + '" ', // source code directory
        function (err) {
            cb(err);
        }
    );
});


/**
 * Cleans dist files
 */
gulp.task('clean', function (cb) {
    return gulpSequence(['clean-dist'], cb);
});


/**
 * Builds the license file for 3rd party node modules
 */
gulp.task('module-licenses', function (cb) {
    var
        // collect license files in an array
        licenseFiles = [];

    // run license crawler to find all licenses
    licenseChecker.init({
        'production': true, // only use production environment, we do not need licencses of dev dependencies
        'start': '.', // use current folder
        'relativeLicensePath': '.'
    }, function (err, json) {
        if (err) {
            console.error(err);
            return;
        }

        // iterate over the returned license dictionary
        for (var key in json)
        {
            // key = name of dependency
            if (json.hasOwnProperty(key)) {
                // see if license file is set
                if (json[key].licenseFile !== undefined) {
                    licenseFiles.push(json[key].licenseFile)
                } else {
                    // print that we did not find a license file
                    console.warn('dependency "' + key + '" does not have a license file.');
                }
            }
        }

        // copy all license files from node_modules
        gulp.src(licenseFiles, {'base': 'node_modules'})
            .pipe(gulpPlumber())
            .pipe(gulpConvertNewline())
            .pipe(gulp.dest(path.join(config.dist, config.moduleLicenseDir)))
            .on('end', cb);
    });
});


/**
 * Cleans the dist folder
 */
gulp.task('clean-dist', function () {
    return gulp.src(path.join(config.dist, '*'), { 'read': false })
        .pipe(gulpPlumber())
        .pipe(gulpClean({ 'force': true }));
});
