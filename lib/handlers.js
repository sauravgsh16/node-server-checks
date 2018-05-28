/*
 * These are the request handlers
 * 
 */

var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

// Define all the handlers
var handlers = {};

/*
 * HTML handlers
 * 
 */ 

handlers.index = function(data, callback){
    // Reject any request that isn't a get
    if(data.method == 'get'){

        // Read the template in a string
        helpers.getTemplate('index', function(err, str){
            if(!err && str){
                callback(200, str, 'html');
            } else {
                callback(500, undefined, 'html')
            }
        });

    } else {
        callback(405, undefined, 'html');
    }
};



/*
 * JSON API handlers
 * 
 */ 

// Ping handler
handlers.ping = function (data, callback){
    callback(200);
};

// Not Found handlers
handlers.notFound = function (data, callback){
    callback(404);
};

// Users
handlers.users = function (data, callback){
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.methods)) {
        handlers._users[data.method](data, callback)
    } else {
        callback(405);
    }
};

// Container for the users submethods
handlers._users = {}

// User - post
// Required data: firstName, lastName, phone, password, tosAggrement
// Optional data: none
handlers._users.post = function(data, callback){
    // Check that all required fields are all filled out
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
    var tosAggrement = typeof (data.payload.tosAggrement) == 'boolean' && data.payload.tosAggrement == true ? true : false;

    if(firstName && lastName && phone && password && tosAggrement){
        // Make sure users doesn't already exist
        _data.read('users', phone, function(err, data) {
            if(err){
                // Hash the password
                var hashedPassword = helpers.hash(password);

                if(hashedPassword) {
                    // Create the user object
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'password': hashedPassword,
                        'tosAggrement': tosAggrement
                    };

                    // Persist the user to disk

                    _data.create('users', phone, userObject, function(err, data){
                        if(!err){
                            callback(200);
                        } else {
                            console.log(err);
                            callback(400, {'Error': 'Could not create user'})
                        }
                    });
                } else {
                    callback(500, {'Error': 'Could not hash the user\'s password'})
                }
            } else {
                // If comes back without err, then we know that user already exist
                callback(400, {'Error': 'User with phone no already exists'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};


// User - get
// Required data: phone
// Optional data : none
// @TODO: only let authenticated users access their object
handlers._users.get = function (inData, callback){
    // Check if phone number is valid
    // Since it's a get request, it will not contain payload, so data will be present in the query string
    var phone = typeof (inData.queryStringObject.phone) == 'string' && inData.queryStringObject.phone.trim().length == 10 ? inData.queryStringObject.phone : false;
    if(phone){

        var token = typeof(inData.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
            if (tokenIsValid){
                _data.read('users', phone, function (err, outData) {
                    if (!err && outData) {
                        // Remove the hashed password from user object returning it back to user
                        delete outData.hashedPassword
                        callback(200, outData);
                    } else {
                        callback(404, { 'Error': 'Data which phone not present' })
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error': 'Missing field is required'});
    }
};

// User - put
// Required data : phone
// Optional data : firstName, lastName, password (at least one must be specified)
// @TODO : only let authenticated user update only their object
handlers._users.put = function (inData, callback){
    // Check for required field
    var phone = typeof(inData.payload.phone) == 'string' && inData.payload.phone.trim().length == 10 ? inData.payload.phone : false;
    // optional fields
    var firstName = typeof (inData.payload.firstName) == 'string' && inData.payload.firstName.trim().length > 0 ? inData.payload.firstName : false;
    var lastName = typeof (inData.payload.lastName) == 'string' && dainDatata.payload.lastName.trim().length > 0 ? inData.payload.lastName : false;
    var password = typeof (inData.payload.password) == 'string' && inData.payload.password.trim().length > 0 ? inData.payload.password : false;

    if(phone){
        if(firstName||lastName||password){

            // Verify token for user authentication

            var token = typeof(inData.headers.token) == 'string' ? inData.headers.token : false;

            handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
                if (tokenIsValid){
                    // Lookup user
                    _data.read('users', phone, function (err, userData) {
                        if (!err && userData) {
                            // Update the fields
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                var hashedPassword = helpers.hash(password);
                                userData.password = hashedPassword;
                            }
                            // Persist data to disk
                            _data.update('users', phone, userData, function (err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, { 'Error': 'Could not update the user' });
                                }
                            });
                        } else {
                            callback(400, { 'Error': 'This specified user does not exist' })
                        }
                    });
                } else {
                    callback(403)
                }
            });

        } else {
            callback({'Error': 'Missing fields to update'})
        }
    } else {
        callback(400, {'Error': 'Missing required fields'})
    }

};

// User - delete
// Required data : phone
// @TODO : only autheticated user can delete their fields
// @TODO : Cleanup (delete any other data files associated with them)
handlers._users.delete = function (inData, callback) {
    // Check for valid phone
    var phone = typeof (inData.queryStringObject.phone) == 'string' && inData.queryStringObject.phone.trim().length == 10 ? inData.queryStringObject.phone : false;
    if(phone) {

        var token = typeof(inData.headers.token) == 'string' ? inData.headers.token : false;

        handlers._tokens.verifyToken(token, phone, function(tokenIsValid){
            if (tokenIsValid){
                _data.read('users', phone, function (err, userData) {
                    if (!err && userData) {
                        _data.delete('users', phone, function (err) {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, { 'Error': 'Could not delete specified user' });
                            }
                        });
                    } else {
                        callback(404, { 'Error': 'This specified user does not exist' });
                    }
                });
            } else {
                callback(403);
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'})
    }
};


// Tokens

handlers.tokens = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put' , 'delete'];
    if (acceptableMethods.indexOf(data.method)) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Creating a token container
handlers._tokens = {}

// post
// Required data : phone, password
// Optional data : none
handlers._tokens.post = function(data, callback) {
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
    if(phone && password){
        // Look up user that matches phone number
        _data.read('users', phone, function(err, userData){
            if(!err && userData) {
                // Hash sent password and compare it to password stored in user object
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword){
                    // If valid, create a new token with a random name, set expiration date - 1hour in the future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;

                    var tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    _data.create('tokens', tokenId, tokenObject, function(err){
                        if(!err) {
                            callback(200, tokenObject);
                        } else {
                            console.log(err);
                            callback(500, {'Error': 'Could not create new tokens'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'Password does not match specified users stored password'})
                }
            } else {
                callback(400, {'Error': 'Could not find specified data'})
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'})
    }
};

// Token get
// Required data : Id
// Optional data : none
handlers._tokens.get = function (data, callback) {
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field, or invalid id'})
    }
};


// Token put
// Required data: id, extend
handlers._tokens.put = function (data, callback) {
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if(id && extend){
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                if(tokenData.expires > Date.now()){
                    tokenDate.expires = Date.now() + 1000 * 60 * 60;
                    _data.update('tokens', id, function(err){
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Could not update token\'s expiration'})
                        }
                    });
                } else {
                    callback(400, {'Error': 'The token has already expired'})
                }
            } else {
                callback(404, {'Error': 'Specified user does not exist'})
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields'})
    }
};


// Token - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function (data, callback) {
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('token', id, function(err, tokenData){
            if(!err && tokenData){
                _data.delete('token', id, function(err){
                    if(!err) {
                        callback(200);
                    } else {
                        console.log(err);
                        callback(500, {'Error': 'Could not delete token'});
                    }
                });
            } else {
                callback(404, {'Error': 'Could not find token'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};


// Verify if a given token is for the given user and has not expired

handlers._tokens.verifyToken = function(id, phone, callback) {
    // LookUp token
    _data.read('token', id, function(err, tokenData){
        if(!err && tokenData){
            if(tokenData.phone == phone && tokenData.expires > Date.now()){
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};


// Checks

handlers.checks = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405)
    }
};

handlers._checks = {}

// Checks - post
// Required data : protocol, url, method, successCodes, timeoutSeconds
// Optional data : none
handlers._checks.post = function(data, callback) {
    var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 == 0 && data.payload.timeoutSeconds > 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {

        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        _data.read('tokens', token, function(err, tokenData){
            if(!err && tokenData){
                var userPhone = tokenData.phone;

                _data.read('users', userPhone, function(err, userData){
                    if(!err && userData){

                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                        if(userChecks.length < config.maxChecks) {

                            var checkId = helpers.createRandomString(20);
                            var checkObject = {
                                'checkId': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            };

                            _data.create('checks', checkId, checkObject, function(err){
                                if(!err){
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    _data.update('users', userPhone, userData, function(err){
                                        if(!err) {
                                            callback(200, checkObjectcheckObject);
                                        } else {
                                            callback(500, {'Error': 'Could not update the user with new check'})
                                        }
                                    });

                                } else {
                                    console.log(err)
                                    callback(500, {'Error': 'Could not create new check'});
                                }
                            });

                        } else {
                            callback(400, {'Error': `The user already has max num of checks ${config.maxChecks}`});
                        }
                    } else {
                        callback(403, {'Error': 'User no longer exists'});
                    }
                });

            } else {
                callback(403, {'Error': 'Invalid token'});
            }
        
        });

    } else {
        callback(404, {'Error': 'Missing required inputs or inputs are invalid'});
    }
};

// checks - get
// Required data : id
// Optional data : none
handlers._checks.get = function(data, callback){
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if(id) {
        // Check the id is valid
        _data.read('checks', id, function(err, checkData){
            if(!err && checkData){
                // get token
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

                // verify token is valid
                handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
                    if(tokenIsValid){
                        callback(200, checkData);
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        });

    } else {
        callback(400, {'Error': 'Missing Required fields'});
    }
};


// checks - put
// Required data : id
// Optional data : protocol, url, method, successCodes, timeoutSeconds

handlers._checks.put = function(data, callback){
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id : false;

    if(id) {
        var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexof(data.payload.protocol) > -1 ? data.payload.protocol : false;
        var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false;
        var method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put' , 'delete'].indexof(data.payload.method) > -1 ? data.payload.method : false;
        var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
        var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 == 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

        if (protocol || url || method || successCodes || timeoutSeconds){

            _data.read('checks', id, function(err, checkData){
                if(!err && checkData) {

                    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

                    handlers._tokens.verifyToken(token, userChecks.userPhone, function(tokenIsValid){
                        if(tokenIsValid){
                            if(protocol) {
                                checkData.protocol = protocol;
                            }
                            if(url){
                                checkData.url = url;
                            }
                            if(method){
                                checkData.method = method;
                            }
                            if(successCodes){
                                checkData.successCodes = successCodes;
                            }
                            if(timeoutSeconds){
                                checkData.timeoutSeconds = timeoutSeconds;
                            }

                            _data.update('ckecks', id, checkData, function(err){
                                if(!err){
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, {'Error': 'Error when updaing checks'})
                                }
                            });
                        
                        } else {
                            callback(403, {'Error': 'Invalid token'})
                        }
                    });

                } else {
                    callback(400, {'Error': 'Check ID does not exist'});
                }
            });

        } else {
            callback(400, {'Error': 'At least one optional data required'});
        }

    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
};


// Checks - delete
// Required data : id
// Optional data : none

handlers._checks.delete = function(data, callback){

    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;

    if(id){

        _data.read('checks', id, function(err, checkData){
            if(!err && checkData){

                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                // Verify token
                handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid){
                    if(tokenIsValid){
                        _data.elete('checks', id, function(err){
                            if(err){
                                // Look up the user's object to get all the checks
                                _data.read('users', checkData.userPhone, function(err, userData){
                                    if(!err && userData){
                                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                        
                                        // Remove the deleted checm from the user's list of checks

                                        var checkPosition = userChecks.indexof(id);
                                        if(checkPosition > -1){
                                            userChecks.splice(checkPosition, 1);
                                            // Re-save the user's data
                                            userData.checks = userChecks;
                                            _data.update('users', checkData.userPhone, userData, function(err){
                                                if(!err){
                                                    callback(200);
                                                } else {
                                                    callback(500, {'Error': 'Could not update user data'});
                                                }
                                            });
                                        } else {
                                            callback(500, {'Error': 'Could not find the check on the user\'s object'});
                                        }
                                    } else {
                                        callback(500, {'Error': 'Could not find user'});
                                    }
                                });

                            } else {
                                callback(500,{'Error': 'Could not delete checks'});
                            }
                        });
                    } else {
                        callback(403);
                    }
                });

            } else {
                callback(404);
            }
        });

    } else {
        callback(400, {'Error': 'Missing required field'});
    }
};

module.exports = handlers;