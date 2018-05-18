/*
 * Main application file
 * 
 */

const server = require('./lib/server');
const worker = require('./lib/worker');

// Declare the app

var app = {};

app.init = function(){
    // Start the server
    server.init();
    // Start the worker
    worker.init();
};

// Execute
app.init();

// Export the app
module.exports = app