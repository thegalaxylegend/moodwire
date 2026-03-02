
const fs = require('fs');
const path = require('path');

const configPath = 'C:\\Users\\Admin\\.openclaw\\openclaw.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Restore a valid config with known token
config.gateway.auth = {
    mode: 'token',
    token: 'a331e75b086be983f0c87888822b2446d7bd94518c3f1ff0'
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('Restored valid gateway auth config.');
