const WebSocket = require('ws');

const port = 3001;
const wss = new WebSocket.Server({port}, console.log('server is listening on ', port));

const clients = [];

function sendToAll(message) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

wss.on('connection', function connection(ws) {
    clients.push(ws);

    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    ws.on('close', function close() {
        clients.splice(clients.indexOf(ws), 1);
    });
});

setInterval(() => {
    sendToAll('Hello, clients!');
}, 1000);
