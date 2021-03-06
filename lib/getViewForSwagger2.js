"use strict";
exports.__esModule = true;
var _ = require("lodash");
var ts = require("./typescript.js");
var normalizeName = function (id) {
    id = id.replace(/_\d{1,3}$/, "");
    return id.replace(/\.|\-|\{|\}/g, '_');
};
var getPathToMethodName = function (opts, m, path) {
    if (path === '/' || path === '') {
        return m;
    }
    // clean url path for requests ending with '/'
    var cleanPath = path.replace(/\/$/, '');
    var segments = cleanPath.split('/').slice(1);
    segments = _.transform(segments, function (result, segment) {
        if (segment[0] === '{' && segment[segment.length - 1] === '}') {
            segment = 'by' + segment[1].toUpperCase() + segment.substring(2, segment.length - 1);
        }
        result.push(segment);
    });
    var result = _.camelCase(segments.join('-'));
    return m.toLowerCase() + result[0].toUpperCase() + result.substring(1);
};
function getData(opts) {
    var swagger = opts.swagger;
    var authorizedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    var data = {
        isNode: false,
        isES6: true,
        description: swagger.info.description,
        isSecure: false,
        moduleName: "",
        className: "",
        imports: "",
        domain: "",
        controllers: [],
        methods: [],
        definitions: []
    };
    _.forEach(swagger.paths, function (api, path) {
        var globalParams = [];
        /**
         * @param {Object} op - meta data for the request
         * @param {string} m - HTTP method name - eg: 'get', 'post', 'put', 'delete'
         */
        _.forEach(api, function (op, m) {
            var M = m.toUpperCase();
            if (M === '' || authorizedMethods.indexOf(M) === -1) {
                throw new Error(M + " in " + path + " is invalid");
            }
            var method = {
                path: path,
                className: opts.className,
                methodName: op.operationId ? normalizeName(op.operationId) : getPathToMethodName(opts, m, path),
                method: M,
                isGET: M === 'GET',
                isPOST: M === 'POST',
                summary: op.description || op.summary,
                externalDocs: op.externalDocs,
                parameters: [],
                controller: op.tags[0],
                headers: []
            };
            var params = [];
            if (_.isArray(op.parameters)) {
                params = op.parameters;
            }
            params = params.concat(globalParams);
            _.forEach(params, function (parameter) {
                if (_.isString(parameter.$ref)) {
                    var segments = parameter.$ref.split('/');
                    parameter = swagger.parameters[segments.length === 1 ? segments[0] : segments[2]];
                }
                parameter.camelCaseName = _.camelCase(parameter.name);
                if (parameter["enum"] && parameter["enum"].length === 1) {
                    parameter.isSingleton = true;
                    parameter.singleton = parameter["enum"][0];
                }
                if (parameter["in"] === 'body') {
                    parameter.isBodyParameter = true;
                }
                else if (parameter["in"] === 'path') {
                    parameter.isPathParameter = true;
                }
                else if (parameter["in"] === 'query') {
                    if (parameter['x-name-pattern']) {
                        parameter.isPatternType = true;
                        parameter.pattern = parameter['x-name-pattern'];
                    }
                    parameter.isQueryParameter = true;
                }
                else if (parameter["in"] === 'header') {
                    parameter.isHeaderParameter = true;
                }
                else if (parameter["in"] === 'formData') {
                    parameter.isFormParameter = true;
                }
                parameter.tsType = ts.convertType(parameter, null);
                parameter.cardinality = parameter.required ? '' : '?';
                method.parameters.push(parameter);
            });
            data.methods.push(method);
        });
    });
    _.forEach(swagger.definitions, function (definition, name) {
        data.definitions.push({
            name: name,
            description: definition.description,
            tsType: ts.convertType(definition, swagger)
        });
    });
    data.definitions.forEach(function (a) {
        a.name = a.name.replace("«", "").replace("»", "");
    });
    var ctrlNames = _.uniq(data.methods.map(function (a) { return (a.controller); }));
    data.controllers = ctrlNames.map(function (a) {
        var methods = data.methods.filter(function (m) { return m.controller === a; });
        var ctrl = {
            name: _.camelCase(a),
            methods: methods
        };
        var _firstPath = methods.find(function (m) { return m.method.toLowerCase() === "delete" && m.path.endsWith("{id}"); });
        if (_firstPath) {
            ctrl["hasPathRes"] = true;
            ctrl["resPath"] = _firstPath.path;
        }
        else {
            ctrl["hasPathRes"] = false;
            ctrl["resPath"] = "";
        }
        return ctrl;
    });
    return data;
}
exports.getData = getData;
