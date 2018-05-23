/*
 * Main application file
 * 
 */

const server = require('./lib/server');
const workers = require('./lib/workers');

// Declare the app

var app = {};

app.init = function(){
    // Start the server
    server.init();
    // Start the worker
    workers.init();
};

// Execute
app.init();

// Export the app
module.exports = app