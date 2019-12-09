'use strict';

const WebSocketServer = require('ws').Server;
const mediasoup = require('mediasoup');
const uuidv1 = require('uuid/v1');

const {createTransport} = require('../mediasoup/mediasoup');

const Peer = require('../peer/peer');

const peers = new Map();

let liveProducers = [];

module.exports = function (server, router) {

    const wss = new WebSocketServer({server: server});

    wss.on('connection', async (socket, request) => {
        console.log('new socket connection [ip%s]', request.headers['x-forwared-for'] || request.headers.origin);

        try {
            const sessionId = uuidv1();
            socket.sessionId = sessionId;
            const peer = new Peer(sessionId);
            peers.set(sessionId, peer);

            const message = JSON.stringify({
                action: 'router-rtp-capabilities',
                routerRtpCapabilities: router.rtpCapabilities,
                sessionId: peer.sessionId
            });

            socket.send(message);
        } catch (error) {
            console.error('Failed to create new peer [error:%o]', error);
            socket.terminate();
            return;
        }

        socket.on('message', async (message) => {
            try {
                const jsonMessage = JSON.parse(message);
                console.log('socket::message [jsonMessage:%o]', jsonMessage);

                const response = await handleJsonMessage(jsonMessage);

                if (response) {
                    console.log('sending response %o', response);
                    socket.send(JSON.stringify(response));

                    //send active producers if response was of type produce
                }
            } catch (error) {
                console.error('Failed to handle socket message [error:%o]', error);
            }
        });

        socket.once('close', () => {
            console.log('socket::close [sessionId:%s]', socket.sessionId);

            const peer = peers.get(socket.sessionId);

            if (peer && peer.process) {
                peer.process.kill();
                peer.process = undefined;
            }
        });

    });

    const handleJsonMessage = async (jsonMessage) => {
        const { action } = jsonMessage;

        switch (action) {
            case 'create-transport':
                return await handleCreateTransportRequest(jsonMessage);
            case 'connect-transport':
                return await handleTransportConnectRequest(jsonMessage);
            case 'produce':
                return await handleProduceRequest(jsonMessage);
            case 'consume':
                return await handleConsumeRequest(jsonMessage);
            case 'live-producers':
                return await handleLiveProducersRequest(jsonMessage);
            default: console.log('handleJsonMessage() unknown action [action:%s]', action);
        }
    };

    const handleCreateTransportRequest = async (jsonMessage) => {
        const transport = await createTransport('webRtc', router);

        transport.appData.transportType = jsonMessage.transportType;
        const peer = peers.get(jsonMessage.sessionId);
        peer.addTransport(transport);

        return {
            action: 'create-transport',
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
            transportType: transport.appData.transportType
        };
    };

    const handleTransportConnectRequest = async (jsonMessage) => {
        const peer = peers.get(jsonMessage.sessionId);

        if (!peer) {
            throw new Error(`Peer with id ${jsonMessage.sessionId} was not found`);
        }

        const transport = peer.getTransport(jsonMessage.transportId);

        if (!transport) {
            throw new Error(`Transport with id ${jsonMessage.transportId} was not found`);
        }

        await transport.connect({ dtlsParameters: jsonMessage.dtlsParameters });
        console.log('handleTransportConnectRequest() transport connected');
        return {
            action: 'connect-transport',
            transportId : jsonMessage.transportId,
            transportType: jsonMessage.transportType
        };
    };

    const handleProduceRequest = async (jsonMessage) => {
        console.log('handleProduceRequest [data:%o]', jsonMessage);

        const peer = peers.get(jsonMessage.sessionId);

        if (!peer) {
            throw new Error(`Peer with id ${jsonMessage.sessionId} was not found`);
        }

        const transport = peer.getTransport(jsonMessage.transportId);

        if (!transport) {
            throw new Error(`Transport with id ${jsonMessage.transportId} was not found`);
        }

        const producer = await transport.produce({
            kind: jsonMessage.kind,
            rtpParameters: jsonMessage.rtpParameters
        });

        peer.addProducer(producer);

        liveProducers.push(producer);

        console.log('handleProducerRequest() new producer added [id:%s, kind:%s]', producer.id, producer.kind);

        return {
            action: 'produce',
            id: producer.id,
            kind: producer.kind
        };
    };

    const handleConsumeRequest = async (jsonMessage) => {
        console.log('handleConsumeRequest [data:%o]', jsonMessage);

        const peer = peers.get(jsonMessage.sessionId);

        if (!peer) {
            throw new Error(`Peer with id ${jsonMessage.sessionId} was not found`);
        }

        const transport = peer.getTransport(jsonMessage.transportId);

        if (!transport) {
            throw new Error(`Transport with id ${jsonMessage.transportId} was not found`);
        }

        if(liveProducers.length < 1){
            throw new Error('There are no producers in the house yet')
        }

        const producer = liveProducers[0];

        if(!router.canConsume({producerId : producer.id, rtpCapabilities : jsonMessage.rtpCapabilities})){
            console.log(`[data:%o] `, {producerId : producer.id, rtpParameters : jsonMessage.rtpParameters});
            throw new Error(`client cannot consume `);
        }

        const consumer = await transport.consume({
            producerId: producer.id,
            rtpCapabilities: jsonMessage.rtpCapabilities,
            paused: true
        });

        peer.addConsumer(consumer);

        console.log('handleConsumerRequest() new consumer added [id:%s, kind:%s]', consumer.id, consumer.kind);

        return {
            action: 'consume',
            producerId: producer.id,
            id: consumer.id,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            type: consumer.type,
            producerPaused: consumer.producerPaused
        };
    };

    const handleLiveProducersRequest = async (jsonMessage) => {
        console.log('handleLiveProducersRequest()');
        let producerIds;
        return {
            action : 'live-producers',
            producers : liveProducers.map(producer => {producer.id})
        };
    };

    return wss;
};