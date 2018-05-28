/*
 * Frontend application file
 * 
 */

var app = {};

app.config = {
    'sessionToken': false
}

// AJAX Client (for RESTful API)
app.client = {}

// Interface for making API calls
app.client.request = function(headers,path,method,queryStringObject,payload,callback){

    // Set defaults
    headers = typeof(headers) == 'object' && headers !== null ? headers : {};
    path = typeof(path) == 'string' ? path : '/';
    method = typeof(method) == 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
    queryStringObject = typeof(queryStringObject) == 'object' &&  queryStringObject !== null ? queryStringObject : {};
    payload = typeof(payload) == 'object' && payload !== null ? payload : {};
    callback = typeof(callback) == 'function' ? callback : false;

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
    xhr.setRequestHeader("Content-type", "application/json");

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
        if(xhr.readyState == XMLHttpRequest.DONE){
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


// Bind the forms
app.bindForms = function(){
    document.querySelector("form").addEventListener("submit", function(e){

        // Stop it from submitting
        e.preventDefault();
        var formId = this.id;
        var path = this.action;
        var method = this.method.toUpperCase();

        // Hide the error message (if it's currently shown due to previous error)
        document.querySelector("#"+formId+" .formError").style.display = 'hidden';

        // Turn the inputs in payload
        var payload = {};
        var elements = this.elements;
        for(var i = 0; i < elements.length; i++){
            if(elements[i].type !== 'submit'){
                var valueOfElement = elements[i].type == 'checkbox' ? elements[i].checked : elements[i].value;
                payload[elements[i].name] = valueOfElement;
            }
        }

        // Call the API

        app.client.request(undefined, path, method, undefined, payload, function(statusCode, responsePayload){
            if(statusCode !== 200){
                // Try to get the error from API or set default error
                var error = typeof(responsePayload.error) == 'string' ? responsePayload.error : 'An error has occured, please try again';

                // Set the formError field with the error
                document.querySelector("#"+formId+" .formError").innerHTML = error;

                // Show (unhide) the form error field on the form

                document.querySelector("#"+formId+" .formError").style.display = 'block';
            } else {
                // If successful, send to form response processor
                app.formResponseProcessor(formId, payload, responsePayload);
            }
        });
    });
};

// Form response Processor

app.formResponseProcessor = function(formId, payload, responsePayload){
    var functionToCall = false;
    if(formId == 'accountCreate'){
        console.log('Creating an account');
    }
};

app.init = function(){
    // Bind all form submission
    app.bindForms();
};


window.onload = function(){
    app.init();
};