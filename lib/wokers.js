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
}


// Timer to execute the worker-process once per minute
workers.loop = function(){
    setInterval(function(){
        workers.gatherAllChecks();
    }, 1000 * 60) // going to execute once a minute
};

// Init Script
workers.init = function(){
    // Execute all the checks as immediately
    worker.gatherAllChecks();

    // Call the lopp as the checks will execute later on
    worker.loop();
};



// Export the module
module.exports = workers;