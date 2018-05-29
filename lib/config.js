var envVar = {};

envVar.staging = {
    'port': 3000,
    'envName': 'Staging',
    'secretKey': 'A secret key',
    'maxChecks' : 5,
    'templateGlobals': {
        'appName': 'UptimeChecker',
        'companyName': 'blah',
        'yearCreated': '2018',
        'baseUrl': 'http://localhost:3000'
    }

}

envVar.production = {
    'port': 5000,
    'envName': 'Production',
    'secretKey': 'A production secret key',
    'maxChecks' : 5,
    'templateGlobals': {
        'appName': 'UptimeChecker',
        'companyName': 'blah',
        'yearCreated': '2018',
        'baseUrl': 'http://localhost:5000'
    }
}

const currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

const envToExport = typeof(envVar[currentEnv]) == 'object' ? envVar[currentEnv] : envVar.staging;

module.exports = envToExport;
