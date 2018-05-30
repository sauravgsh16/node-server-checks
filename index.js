/*
 * Main application file
 * 
 */

const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');

// Declare the app

var app = {};

app.init = function(){

    // Start the server
    server.init();

    // Start the worker
    workers.init();

    // Start the CLI, but make sure that it starts last
    setTimeout(() => {
        cli.init();
    }, 50);
};

// Execute
app.init();

// Export the app
module.exports = app;