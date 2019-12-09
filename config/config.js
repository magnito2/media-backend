module.exports = {
    sslCrt: './certs/mediasoup-test.crt',
    sslKey: './certs/mediasoup-test.key',
    listenPort: 4000,
    mediasoup: {
        // Worker settings
        worker: {
            rtcMinPort: 10000,
            rtcMaxPort: 10100,
            logLevel: 'warn',
            logTags: [
                'info',
                'ice',
                'dtls',
                'rtp',
                'srtp',
                'rtcp'
            ],
        },
        // Router settings
        router: {
            mediaCodecs:
                [
                    {
                        kind: 'audio',
                        mimeType: 'audio/opus',
                        clockRate: 48000,
                        channels: 2
                    },
                    {
                        kind: 'video',
                        mimeType: 'video/VP8',
                        clockRate: 90000,
                        parameters:
                            {
                                'x-google-start-bitrate': 1000
                            }
                    },
                ]
        },
        transport : {
            webRtcTransport: {
                listenIps: [ { ip: '10.10.2.37', announcedIp: undefined } ],
                enableUdp: true,
                enableTcp: true,
                preferUdp: true,
                maxIncomingBitrate: 1500000
            },
            plainRtpTransport: {
                listenIp: '127.0.0.1',
                rtcpMux: true,
                comedia: false
            }
        }
    },
    database:{
        DB: 'mongodb://localhost:27017/reactcrud',
        secretOrKey : 'IserveAlivingGodHehasthefinalSay'
    }
};
