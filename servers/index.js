//'use strict';
const express =  require('express');
const https = require('https');
const fs = require('fs');

const config = require('../config/config');

const app = express();

const { sslKey, sslCrt } = config;
console.log(sslKey, sslCrt);
if (!fs.existsSync(sslKey) || !fs.existsSync(sslCrt)) {
    console.error('SSL files are not found. check your config.js file');
    process.exit(0);
}
const tls = {
    cert: fs.readFileSync(sslCrt),
    key: fs.readFileSync(sslKey),
};

const server = https.createServer(tls, app);

let router;

const {
    initializeSoup,
    createTransport
} = require('./mediasoup-server');


(async () => {
    router = await initializeSoup();

    let wss = require('./websocket-server')(server, router);
    const httpapp = require('./http-server')(app);


})();

module.exports = server;