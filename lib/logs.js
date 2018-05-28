/*
 * Library for storing and rotating logs
 * 
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

var lib = {};

lib.baseDir = path.join(__dirname, '/../.logs/');

// Append the string to the file. Create the file if it does not exist

lib.append = function(file, str, callback){
    // Open the file for appending
    fileName = path.resolve(lib.baseDir, file + '.log');
    fs.open(fileName, 'a', function(err, fileDescriptor){
        if(!err && fileDescriptor){
            // Append to file and close it
            fs.appendFile(fileDescriptor, str+'\n', function(err){
                if (!err){
                    // Close file
                    fs.close(fileDescriptor, function(err){
                        if(!err){
                            callback(false);
                        } else {
                            callback('Error closing file that was being appended');
                        }
                    });
                } else {
                    callback('Error appending to file');
                }
            });
        } else {
            callback('Could not open file for appending');
        }
    });
};


lib.list = function(includeCompressedLogs, callback){
    fs.readdir(lib.baseDir, function(err, data){
        if(!err && data && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach(function(fileName){
                
                // Add the .log files
                if(fileName.indexOf('.log') > -1){
                    trimmedFileNames.push(fileName.replace('.log', ''));
                }

                // Add the .gz files
                if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs){
                    trimmedFileNames.push(fileName.replace('.gz.b64', ''));
                }
            });
            callback(false, trimmedFileNames);
        } else {
            callback(err, data);
        }
    });
};


lib.compress = function(logId, newFileId, callback){
    var sourceFile = logId + '.log';
    var destFile = newFileId + '.gz.b64';

    fs.readFile(lib.baseDir+sourceFile, 'utf8', function(err, inputString){
        if(!err && inputString){

            // Compress the data using zlib
            zlib.gzip(inputString, function(err, buffer){

                if(!err && buffer){
                    // Send the data to the destination file
                    fs.open(lib.baseDir+destFile, 'wx', function(err, fileDescriptor){
                        if(!err && fileDescriptor){
                            // Write file to the destination
                            fs.writeFile(fileDescriptor, buffer.toString('base64'), function(err){
                                if(!err){
                                    // Close the file
                                    fs.close(fileDescriptor, function(err){
                                        if(!err){
                                            callback(false);
                                        } else {
                                            callback(err);
                                        }
                                    });
                                } else {
                                    callback(err);
                                }
                            });
                        } else {
                            callback(err);
                        }
                    });
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
    });
};


// Decompress the contents of a .gz file in a string variable
lib.decompress = function(fileId, callback){
    var fileName = fileId + '.gz.b64';

    fs.readFile(lib.baseDir+ fileName, 'utf8', function(err, str){
        if(!err && str){
            // Inflate the data
            var inputBuffer = Buffer.from(str, 'base64');
            zlib.unzip(inputBuffer, function(err, outputBuffer){
                if(!err && outputBuffer){
                    var str = outputBuffer.toString();
                    callback(false, str);
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
    });
};


// Truncate a log file
lib.truncate = function(logId, callback){
    fs.truncate(lib.baseDir+logId+'.log', 0, function(err){
        if(!err){
            callback(false);
        } else {
            callback(err);
        }
    });
};


module.exports = lib;