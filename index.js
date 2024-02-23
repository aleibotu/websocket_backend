const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

const server = https.createServer({
    cert: fs.readFileSync('./cert1.pem'),
    key: fs.readFileSync('./privkey1.pem')
});

const wss = new WebSocket.Server({ server });

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

const port = 443;
server.listen(port, () => {
    console.log('Server started on port ', port);
});
