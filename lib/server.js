/*
 * Server related tasks
 * 
 */


const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const data = require('./data');
const handlers = require('./handlers');
const helpers = require('./helpers')

// Instantiate the server module object

var server = {};

server.httpServer = http.createServer(function (req, res) {

    var parsedUrl = url.parse(req.url, true);

    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    var queryStringObject = parsedUrl.query;
    var method = req.method.toLowerCase();
    var headers = req.headers;

    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    req.on('end', function () {

        buffer += decoder.end();
        var chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        }

        chosenHandler(data, function (statusCode, payload) {

            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            payload = typeof (payload) == 'object' ? payload : {};

            var payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log(`payload: ${payloadString}, statusCode: ${statusCode}`);
        });
    });
});

const port = config.port;

server.router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.token,
    'checks': handlers.checks
};

server.init = function(){
    // Start the http server
    server.httpServer.listen(port, function () {
        console.log(`Server running on port ${port}`);
    });
};

module.exports = server;