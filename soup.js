/**
 this will be our main entry point now.
 */

const config = require('./config/config');

const port = config.listenPort || 4000;

const server = require('./servers/index');

server.listen(port);

console.log('listening on port', port);