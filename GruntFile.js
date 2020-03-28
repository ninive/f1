module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.initConfig({
        concat: {
            dist: {
                src: [  "src/game/**/*.js"
                    
                     ],
                dest: 'deploy/js/f1.js'
            }
        },
        uglify: {
            js: {
                files: {
                    'deploy/js/f1.js': ['deploy/js/f1.js']
                }
            }
        }
    });

    grunt.registerTask('default', ['concat', 'uglify']);

}