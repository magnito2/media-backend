const mediasoup = require('mediasoup');

const config = require('../config/config');


module.exports.createTransport = async (transportType, router, options) => {
    console.log('createTransport() [type:%s. options:%o]', transportType, options);

    switch (transportType) {
        case 'webRtc':
            return await router.createWebRtcTransport(config.mediasoup.transport.webRtcTransport);
        case 'plain':
            return await router.createPlainRtpTransport(config.mediasoup.transport.plainRtpTransport);
    }
};
