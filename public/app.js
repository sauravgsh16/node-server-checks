/*
 * Frontend application file
 * 
 */

var app = {};

app.config = {
    'sessionToken': false
}

// AJAX Client
app.client = {};

app.client.request = function(headers, path , method, queryStringObject, payload, callback){

    // Set defaults
    headers = typeof(headers) == 'object' && headers !== null ? headers : {};
    path = typeof(path) == 'string' ? path : '/';
    method = typeof(method) == 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
    queryStringObject = typeof(queryStringObject) == 'object' &&  queryStringObject !== null ? queryStringObject : {};
    payload = typeof(payload) == 'object' && payload !== null ? payload : {};
    callback = typeof(callabck) == 'function' ? callback : false;

    // For each quesry string parameter sent, add it to the path variable
    var requestUrl = path+'?';
    var counter = 0;
    for(var queryKey in queryStringObject){
        if(queryStringObject.hasOwnProperty(queryKey)){
            counter++;
            // If at least one query string parameter has been prepended to path, append the path with ampersand
            if(counter > 1){
            requestUrl+='&';
            }
            requestUrl+=queryKey+'='+queryStringObject[queryKey];
        }
    }

    // Form the http request as a JSON type
    var xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true); // 3rd param 'true' for async call
    xhr.setRequestHeader("Content-Type", "application/json");

    // For each header send add it to the request
    for(headerKey in headers){
        if(headers.hasOwnProperty(headerKey)){
            xhr.setRequestHeader(headerKey, headers[headerKey]);
        }
    }

    // If there is a current session token set, add that as a header
    if(app.config.sessionToken){
        xhr.setRequestHeader("token", app.config.sessionToken.id);
    }

    xhr.onreadystatechange = function(){
        if(xhr.readyState = XMLHttpRequest.DONE){
            var statusCode = xhr.status;
            var responseReturned = xhr.responseText;

            if(callback){
                try{
                    var parsedResponse = JSON.parse(responseReturned);
                    callback(statusCode, parsedResponse);
                } catch(e){
                    callback(statusCode, false);
                }
            }
        }
    };

    var payloadString = JSON.stringify(payload);
    xhr.send(payloadString);

};