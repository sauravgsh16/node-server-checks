/*
 * Worker related tasks
 *
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const _data = require('./data');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const _logs = require('./logs');

// Instantiate the worker object
var workers = {};

// Look up all checks, get their data, send to a validator
workers.gatherAllChecks = function(){
    // get all the checks
    _data.list('checks', function(err, checks){
        if(!err && check && check.length > 0) {
            checks.ForEach(function(check){
                // Read in the check data
                _data.read('checks', check, function(err, originalCheckData){
                    if (!err && originalCheckData){
                        //Pass the data to the check validator and let that function continue and log errors if necessary
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log("Error: Reading one of the check's data");
                    }
                });
            });
        } else {
            console.log("Error: Could not find any checks to process");
        }
    });
};

workers.validateCheckData = function(originalCheckData){
    originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData != null ? originalCheckData : {};
    originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
    originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
    originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
    originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get' ,'put' ,'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
    originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 == 0 && originalCheckData.timeoutSeconds > 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

    // Set the keys that may not be set (if the worker has never seen this key before)
    originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    if (originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds) {
        workers.performCheck(originalCheckData);
    } else {
        console.log('Error: One of the check is not properly formatted. Skipping ..');
    }
};

workers.performCheck = function(originalCheckData) {
    // Prepare the initial check outcome
    var checkOutcome = {
        'error': false,
        'responseCode': false
    }

    // Mark that the outcome has not been sent yet

    var outcomeSent = false;

    // Parse the hostname and the path out of the originalCheckData

    var parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
    var hostName = parsedUrl.hostname;
    var path = parsedUrl.path // Using path and not not pathname as we require the queryString also

    // Construct the request
    var requestDetails = {
        'protocol': originalCheckData.protocol + ':',
        'hostname': hostName,
        'method': originalCheckData.method.toUpper(),
        'path': path,
        'timeout': originalCheckData.timeoutSeconds
    }

    // Instantiate the request object to use either http or https
    var _moduleToUse = originalCheckData.protocol == 'http' ? 'http' : 'https';
    var req = _moduleToUse.request(requestDetails, function(res){

        // Grab status
        var status = res.statusCode;

        // Update the checkOutcome and pass the data along
        checkOutcome.responseCode = status;

        if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // Bind the error so that it does not get thrown
    req.on('error', function(e){
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {'error': true, 'value': e};
        if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // Bind the timeout event
    res.on('timeout', function(timeout){
        // Update the checkOutcome and pass it along
        checkOutcome.error = {'error': true, 'value': timeout};
        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // End the request
    res.end();
};


// Process the checkOutcome, update the check data as needed, trigger an alert if needed
// Special logic for accomodating a check that has never been tested before (don't alert on that)
workers.processCheckOutcome = function(originalCheckData, checkOutcome){

    // Decide if a check is considered up or down
    var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    // Decide if alert is warranted
    var alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

    var timeOfCheck = Date.now();
    workers.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck);

    // Update the check data
    var newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfCheck;

    // Save the updates
    _data.update('checks', newCheckData.id, newCheckData, function(err){
        if(!err) {
            // Send the new check data to the next phase in the process if needed
            if(alertWarranted) {
                workers.alertUserToStatusChenge(newCheckData);
            } else {
                console.log('Check outcome has not changed, no alert needed');
            }

        } else {
            console.log("Error trying to save updates for one of the checks")
        }
    });
};

// Àlert the user to a status change
workers.alertUserToStatusChenge = function(newCheckData){
    var msg = 'Alert: Your check for '+newCheckData.method.toUpperCase()+' '+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;

    // sendTwilioSms -- but just for simplicity we ae just logging it out to console
    console.log(msg);
};


workers.log = function (originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck){
    var logData = {
        'check': originalCheckData,
        'outcome': checkOutcome,
        'state': state,
        'alert': alertWarranted,
        'time': timeOfCheck
    };

    // Convert data to string
    var logString = JSON.stringify(logData);
    // Determine the name of the log file
    var logFileName = originalCheckData.id;

    // Append the logString to the log file
    _logs.append(logFileName, logString, function(err){
        if(!err){
            console.log('Logging to file succeeded');
        } else {
            console.log('Logging to file failed', err);
        }
    });
};


// To Rotate (compress the log file)

workers.rotateLogs = function () {
    // List all the non-compressed log files

    _logs.list(false, function(err, logs){
        if(!err && logs && logs.length > 0){
            logs.ForEach(function(logName){
                var logId = logName.replace('.log', '');
                var newFileId = logId + '-' + Date.now();
                // Compress the logs
                _logs.compress(logId, newFileId, function(err){
                    if(!err){
                        // 
                        _logs.truncate(logId, function(err){
                            if(!err){
                                console.log('Success truncationg logFile');
                            } else {
                                console.log('Error truncating one of the log file', err);
                            }
                        });
                    } else {
                        console.log('Error compressing one of the log files', err);
                    }
                });
            });
        } else {
            console.log('Error: could not find any logs to rotate');
        }
    });

};

// Timer to execute the worker-process once per minute
workers.loop = function(){
    setInterval(function(){
        workers.gatherAllChecks();
    }, 1000 * 60) // going to execute once a minute
};


// Timer to execute log rotation process once pre day
workers.logRotationLoop = function(){
    setInterval(function(){
        workers.rotateLogs();
    }, 1000 * 60 * 60* 24) // going to execute every 24 hours
};


// Init Script
workers.init = function(){
    // Execute all the checks as immediately
    workers.gatherAllChecks();

    // Call the lopp as the checks will execute later on
    workers.loop();

    // Compress all the logs immediately
    workers.rotateLogs();

    // Call the compression loop sp logs will be compressed later on

    workers.logRotationLoop();
};

// Export the module
module.exports = workers;