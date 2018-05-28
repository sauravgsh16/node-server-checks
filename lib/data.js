/*
 * Library for storing and editing data
 *
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers')

var lib = {};

lib.baseDir = path.join(__dirname, '../.data/');

lib.create = function(dir, file, data, callback){
    var absFilePath = path.resolve(lib.baseDir, dir, file + '.json')
    fs.open(absFilePath, 'wx', function(err, fileDescriptor){
        if(!err && fileDescriptor) {
            var writableData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, writableData, function(err){
                if(!err){
                    fs.close(fileDescriptor, function(err){
                        if(!err) {
                            callback(false);
                        } else {
                            callback('Could not close files');
                        }
                    })
                } else {
                    callback('Could not write data to file');
                }
            });
        } else {
            callback('Error opening the file');
        }
    });
};


lib.read = function(dir, file, callback){
    var fileAbsPath = path.resolve(lib.baseDir, dir, file + '.json');
    fs.readFile(fileAbsPath, 'utf-8', function(err, data){
        if(!err){
            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err, data);
        }
    });
};

lib.update = function(dir, file, data, callback){
    fileAbsPath = path.resolve(lib.baseDir, dir, file + '.json');
    fs.open(fileAbsPath, 'r+', function(err, fileDescriptor){
        if(!err && fileDescriptor){
            var stringData = JSON.stringify(data);
            fs.truncate(fileDescriptor, function(err){
               if(!err) {
                    fs.writeFile(fileDescriptor, stringData, function(err){
                        if(!err) {
                            fs.close(fileDescriptor, function(err){
                                if(!err) {
                                    callback(false);
                                } else {
                                    callback('Error while closing file');
                                }
                            });
                        } else {
                            callback('Error while writing file');
                        }
                    });
               } else {
                   callback('Error while truncating file');
               }
            });
        } else {
            callback('Error while opening file');
        }
    });
};

lib.delete = function(dir, file, callback){
    var fileAbsPath = path.resolve(lib.baseDir, dir, file + '.json');
    fs.unlink(fileAbsPath, 'r+', function(err){
        callback(err);
    });
};


lib.list = function(dir, callback){
    fs.readdir(lib.baseDir+dir+'/', function(err, data){
        if(!err && data && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach(function(fileName){
                trimmedFileNames.push(fileName.replace('.json', ''));
            });
            callback(false, trimmedFileNames);
        } else {
            callback(err, data);
        }
    });
};

module.exports = lib;