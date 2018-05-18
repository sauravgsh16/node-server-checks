var envVar = {};

envVar.staging = {
    'port': 3000,
    'envName': 'Staging',
    'secretKey': 'A secret key'
}

envVar.production = {
    'port': 3000,
    'envName': 'Production',
    'secretKey': 'A production secret key'
}

const currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

const envToExport = typeof(envVar[currentEnv]) == 'object' ? envVar[currentEnv] : envVar.staging;

module.exports = envToExport;
