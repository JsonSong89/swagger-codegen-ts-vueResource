'use strict';

var assert = require('assert');
var vows = require('vows');
var fs = require('fs');
var ffs = require('final-fs');
var ts = require('typescript');
var tmp = require('tmp');
var rp = require('request-promise-native');


var CodeGen = require('../lib/codegen').CodeGen;
var CodeGen2 = require('../lib/codegen2').CodeGen;
var CodeGenTs = require('../lib/codegenTs').CodeGen;


function getCode() {
    rp("http://local.jsonsong.com:4070/v2/api-docs").then(swaggerStr => {
        var result = CodeGenTs.getTypescriptCode({
            className: 'bms',
            swagger: JSON.parse(swaggerStr)
        });
        fs.writeFileSync("../dist/api.ts", result, {});
        process.exit()
    });
}

getCode();



