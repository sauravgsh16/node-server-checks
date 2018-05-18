/*
 * Helper functions
 * 
 */
var crypto = require('crypto');
var config = require('./config')

var helpers = {};

helpers.hash = function (str){
    if (typeof(str) == 'string' && str.length > 0){
        var hash = crypto.createHmac('sha256', config.secretKey).update(str).digest('hex');
    } else {
        return false;
    }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function (str){
    try{
        return JSON.parse(str);
    } catch(err) {
        return {};
    }
};

// Create a string of random alphanumeric characters of a given length

helpers.createRandomString = function(strLength){
    var strLength = typeof(strLength) == 'string' && strLength > 0 ? strLength : false;
    if (strLength) {
        // Define all possible characters that can make up a string
        var possibleChar = 'abcdefghijklmnopqrstuvwxyz0123456789';
        
        var str = '';
        for(i=1; i<=strLength; i++){
            // Get a random character
            var randomChar = possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));
            // Append this char to the final str
            str += randomChar;
        }   
        return str;
    } else {
        return false;
    }
}

module.exports = helpers;