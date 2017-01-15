module.exports = function exports(grunt) {
  grunt.initConfig({
    watch: {
      scripts: {
        files: [
          'src/**/*.js'
        ],
        tasks: ['babel'],
        options: {
          spawn: true
        }
      }
    },
    babel: {
      dist: {
        files: {
          'dist/script.js': 'src/script.js',
          'dist/logger.js': 'src/logger.js',
          'dist/icons.js': 'src/icons.js'
        }
      }
    },
    clean: ['dist/*']
  });
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.registerTask('build', ['clean', 'babel']);
  grunt.registerTask('default', ['build']);
};
