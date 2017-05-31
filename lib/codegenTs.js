var fs = require('fs');
var Mustache = require('mustache');
var beautify = require('js-beautify').js_beautify;
var lint = require('jshint').JSHINT;
var _ = require('lodash');
var getViewForSwagger2 = require('./getViewForSwagger2').getData;


var getCode = function (opts, type) {
    // For Swagger Specification version 2.0 value of field 'swagger' must be a string '2.0'
    if (opts.swagger.swagger !== '2.0') throw new Error("only for swagger 2.0");
    var data = getViewForSwagger2(opts, type);

    if (!_.isObject(opts.template)) {
        opts.template = {};
    }
    let templates = __dirname + '/../templates/';
    let template = fs.readFileSync(templates + 'api.mustache', 'utf-8');
    opts.template.method = fs.readFileSync(templates + 'typescript-method.mustache', 'utf-8');
    opts.template.type = fs.readFileSync(templates + 'type.mustache', 'utf-8');

    var source = Mustache.render(template, data, opts.template);
    var lintOptions = {
        node: type === 'node' || type === 'custom',
        browser: type === 'angular' || type === 'custom' || type === 'react',
        undef: true,
        strict: true,
        trailing: true,
        smarttabs: true,
        maxerr: 999
    };
    if (opts.esnext) {
        lintOptions.esnext = true;
    }

    if (type === 'typescript') {
        opts.lint = false;
    }

    if (opts.lint === undefined || opts.lint === true) {
        lint(source, lintOptions);
        lint.errors.forEach(function (error) {
            if (error.code[0] === 'E') {
                throw new Error(error.reason + ' in ' + error.evidence + ' (' + error.code + ')');
            }
        });
    }
    if (opts.beautify === undefined || opts.beautify === true) {
        return beautify(source, {indent_size: 4, max_preserve_newlines: 2});
    } else {
        return source;
    }
};

exports.CodeGen = {
    getTypescriptCode: function (opts) {
        if (opts.swagger.swagger !== '2.0') {
            throw 'Typescript is only supported for Swagger 2.0 specs.';
        }
        return getCode(opts, 'typescript');
    },
};
