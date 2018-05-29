/*
 * Helper functions
 * 
 */
var crypto = require('crypto');
var config = require('./config')
var path = require('path');
var fs = require('fs');

var helpers = {};

helpers.hash = function (str) {
  if (typeof (str) == 'string' && str.length > 0) {
    var hash = crypto.createHmac('sha256', config.secretKey).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function (str) {
  try {
    return JSON.parse(str);
  } catch (err) {
    return {};
  }
};

// Create a string of random alphanumeric characters of a given length
helpers.createRandomString = function (strLength) {
  var strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all possible characters that can make up a string
    var possibleChar = 'abcdefghijklmnopqrstuvwxyz0123456789';

    var str = '';
    for (i = 1; i <= strLength; i++) {
      // Get a random character
      var randomChar = possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));
      // Append this char to the final str
      str += randomChar;
    }
    return str;
  } else {
    return false;
  }
};

// Get the string content of a template
helpers.getTemplate = function (templateName, data, callback) {
  templateName = typeof (templateName) == 'string' && templateName.length > 0 ? templateName : false;
  data = typeof (data) == 'object' && data !== null ? data : {};

  if (templateName) {
    var templatesDir = path.join(__dirname, '/../templates/');
    fs.readFile(templatesDir + templateName + '.html', 'utf8', function (err, str) {
      if (!err && str && str.length > 0) {
        var finalString = helpers.interpolate(str, data);
        callback(false, finalString);
      } else {
        callback('No template could be found');
      }
    });
  } else {
    callback('A valid template name was not specified');
  }
};
helpers.addUniversalTemplates = function (str, data, callback) {
  str = typeof (str) == 'string' && str.length > 0 ? str : '';
  data = typeof (data) == 'object' && data !== null ? data : {};

  // Get the header
  helpers.getTemplate('_header', data, function (err, headerString) {
    if (!err && headerString) {
      helpers.getTemplate('_footer', data, function (err, footerString) {
        if (!err && footerString) {
          // Add them all together
          finalString = headerString + str + footerString;
          callback(false, finalString);
        } else {
          callback('Could not find footer template');
        }
      });
    } else {
      callback('Could not find header template');
    }
  });
};

// Take a given string and data object and find/replace all the keys within it
helpers.interpolate = function (str, data) {
  str = typeof (str) == 'string' && str.length > 0 ? str : '';
  data = typeof (data) == 'object' && data !== null ? data : {};

  // Add the templateGlobals to the data object, prepending their key name with "global."
  for (var keyName in config.templateGlobals) {
    if (config.templateGlobals.hasOwnProperty(keyName)) {
      data['global.' + keyName] = config.templateGlobals[keyName]
    }
  }

  // For each key in the data object, insert it's value into the string at the corresponding placeholder
  for (var key in data) {
    if (data.hasOwnProperty(key) && typeof (data[key]) == 'string') {
      var replace = data[key];
      var find = '{' + key + '}';
      str = str.replace(find, replace);
    }
  }
  return str;
};


// Get the contents of a static (public) asset
helpers.getStaticAsset = function (fileName, callback) {
  var fileName = typeof (fileName) == 'string' && fileName.length > 0 ? fileName : '';
  if (fileName) {
    var publicDir = path.join(__dirname, '/../public/');
    fs.readFile(publicDir + fileName, function (err, data) {
      if (!err && data) {
        callback(false, data);
      } else {
        callback('No file could be found')
      }
    });
  } else {
    callback('A valid file name was not specified');
  }
};

module.exports = helpers;