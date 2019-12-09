'use strict';

/**
 here we only put our mediasoup logic
 */

const mediasoup = require('mediasoup');
const config = require('../config/config');

let worker;
let router;

const initializeWorker = async () => {
    worker = mediasoup.createWorker({
        logLevel: config.mediasoup.worker.logLevel,
        logTags: config.mediasoup.worker.logTags,
        rtcMinPort: config.mediasoup.worker.rtcMinPort,
        rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });
    return  worker;
};

const createRouter = async () => {
    console.log('createRouter() creating new router [worker.pid:%d]', worker.pid);

    return await worker.createRouter({ mediaCodecs: config.mediasoup.router.mediaCodecs });
};

module.exports.createTransport = async (transportType, router, options) => {
    console.log('createTransport() [type:%s. options:%o]', transportType, options);

    switch (transportType) {
        case 'webRtc':
            return await router.createWebRtcTransport(config.webRtcTransport);
        case 'plain':
            return await router.createPlainRtpTransport(config.plainRtpTransport);
    }
};

module.exports.initializeSoup = async () => {
    console.log('initializeSoup() called');
    worker = await initializeWorker();

    worker.once('died', () => {
        console.error('worker::died worker has died exiting in 2 seconds... [pid:%d]', worker.pid);
        setTimeout(() => process.exit(1), 2000);
    });

    router = await createRouter();

    return router;
};