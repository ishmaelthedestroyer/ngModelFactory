/**
 * configuration for grunt tasks
 * @module Gruntfile
 */

module.exports = function(grunt) {
  /** load tasks */
  require('load-grunt-tasks')(grunt);

  /** config for build paths */
  var config = {
    dist: {
      dir: 'dist/',
      factory: 'dist/Factory.js',
      model: 'dist/Model.js',
      mixins: 'dist/mixins.js',
      ngModelFactory: 'dist/ngModelFactory.js'
    },
    src: {
      dir: 'src/'
    },
    tmp: {
      dir: 'tmp/'
    }
  };

  /** paths to files */
  var files = {

    /** src files */
    factory: [
      'Factory.js'
    ],

    /** src files */
    model: [
      'Model.js'
    ],

    /** src files */
    mixins: [
      'mixins.js'
    ]
  };

  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */

  /** config for grunt tasks */
  var taskConfig = {

    /** concatentation tasks for building the source files */
    concat: {

      factory: {
        options: {
          // stripBanners: true
          banner: 'angular.module("ngModelFactory.Factory", [\n' +
            '"EventEmitter",\n' +
            '"Endpoint",\n' +
            '"Util"\n' +
            ']).service("ngModelFactory.Factory", [\n' +
            '"$log",\n' +
            '"$q",\n' +
            '"ngModelFactory.Model",\n' +
            '"ngModelFactory.mixins",\n' +
            '"Endpoint",\n' +
            '"EventEmitter",\n' +
            '"Util",\n' +
            'function($log, $q, Model, mixins, Endpoint, EventEmitter, util) {\n\n',
          footer: '\n\n' +
            'return Factory;\n}' +
            '\n]);'
        },
        src: (function() {
          var cwd = config.src.dir;

          return files.factory.map(function(path) {
            return cwd + path;
          });
        })(),
        dest: config.dist.factory
      },

      model: {
        options: {
          // stripBanners: true
          banner: 'angular.module("ngModelFactory.Model", [\n' +
            '"EventEmitter",\n' +
            '"Endpoint",\n' +
            '"Util"\n' +
            ']).service("ngModelFactory.Model", [\n' +
            '"$log",\n' +
            '"$q",\n' +
            '"Endpoint",\n' +
            '"EventEmitter",\n' +
            '"ngModelFactory.mixins",\n' +
            '"Util",\n' +
            'function($log, $q, Endpoint, EventEmitter, mixins, util) {\n\n',
          footer: '\n\n' +
            'return Model;\n\n}' +
            '\n]);'
        },
        src: (function() {
          var cwd = config.src.dir;

          return files.model.map(function(path) {
            return cwd + path;
          });
        })(),
        dest: config.dist.model
      },

      mixins: {
        options: {
          // stripBanners: true
          banner: 'angular.module("ngModelFactory.mixins", [\n' +
            '"Endpoint",\n' +
            '"Util"\n' +
            ']).service("ngModelFactory.mixins", [\n' +
            '"Endpoint",\n' +
            '"Util",\n' +
            'function(Endpoint, util) {\n\n',
          footer: '\n\n' +
            'return mixins;\n}' +
            '\n]);'
        },
        src: (function() {
          var cwd = config.src.dir;

          return files.mixins.map(function(path) {
            return cwd + path;
          });
        })(),
        dest: config.dist.mixins
      },

      ngModelFactory: {
        options: {
          // stripBanners: true
          separator: '\n\n',
          footer: '\n\n' +
            'angular.module("ngModelFactory", [\n' +
            '"ngModelFactory.Factory",\n' +
            '"ngModelFactory.Model",\n' +
            '"ngModelFactory.mixins"\n' +
            ']);'
        },
        src: (function() {
          return [
            config.dist.factory,
            config.dist.model,
            config.dist.mixins
          ];
        })(),
        dest: config.dist.ngModelFactory
      }
    },


    /** uglify (javascript minification) config */
    uglify: {
      factory: {
        options: {},
        files: [
          {
            src: config.dist.factory,
            dest: (function() {
              var split = config.dist.factory.split('.');
              split.pop(); // removes `js` extension
              split.push('min'); // adds `min` extension
              split.push('js'); // adds `js` extension

              return split.join('.');
            })()
          }
        ]
      },

      model: {
        options: {},
        files: [
          {
            src: config.dist.model,
            dest: (function() {
              var split = config.dist.model.split('.');
              split.pop(); // removes `js` extension
              split.push('min'); // adds `min` extension
              split.push('js'); // adds `js` extension

              return split.join('.');
            })()
          }
        ]
      },

      mixins: {
        options: {},
        files: [
          {
            src: config.dist.mixins,
            dest: (function() {
              var split = config.dist.mixins.split('.');
              split.pop(); // removes `js` extension
              split.push('min'); // adds `min` extension
              split.push('js'); // adds `js` extension

              return split.join('.');
            })()
          }
        ]
      },

      ngModelFactory: {
        options: {},
        files: [
          {
            src: config.dist.ngModelFactory,
            dest: (function() {
              var split = config.dist.ngModelFactory.split('.');
              split.pop(); // removes `js` extension
              split.push('min'); // adds `min` extension
              split.push('js'); // adds `js` extension

              return split.join('.');
            })()
          }
        ]
      }
    }
  };

  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */
  /* # # # # # # # # # # # # # # # # # # # # */

  // register default & custom tasks

  grunt.initConfig(taskConfig);

  grunt.registerTask('default', [
    'build'
  ]);

  grunt.registerTask('build', [
    'concat',
    'uglify'
  ]);

};