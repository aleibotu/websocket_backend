require('dotenv').config();
const WebSocket = require('ws');
const mqtt = require('mqtt');
const {MongoClient} = require('mongodb');

const port = 3001;
const wss = new WebSocket.Server({port}, () => console.log('server is listening on ', port))
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

const {
    MONGO_USER,
    MONGO_PASS,
    MONGO_HOST,
    MONGO_PORT,
    MONGO_DATABASE,
    MONGO_COLLECTION,

    MQTT_BROKER_HOST,
    MQTT_USER_NAME,
    MQTT_PASS_WORD
} = process.env;

async function connectToMongo() {
    const url = `mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`;
    const client = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    return client.db(MONGO_DATABASE).collection(MONGO_COLLECTION);
}

let mongoCollection;

connectToMongo()
    .then(collection => {
        mongoCollection = collection;
        startMqtt();
    })
    .catch(error => {
        console.error('Error connecting to MongoDB:', error);
    });

const topic = 'sensor/001/temp012'
const clientId = "emqx_react_" + Math.random().toString(16).substring(2, 8);
function startMqtt() {
    const client = mqtt.connect(`ws://${MQTT_BROKER_HOST}:8083/mqtt`, {
        clientId,
        username: MQTT_USER_NAME,
        password: MQTT_PASS_WORD
    });
    client.on("connect", () => {
        console.log("Connected to MQTT broker");
        client.subscribe(topic, (err) => {
            if (err) {
                console.error("Error subscribing to MQTT topic:", err);
            } else {
                console.log("Subscribed to MQTT topic:", topic);
            }
        });
    });

    client.on("message", (topic, message) => {
        console.log(message.toString())
        handleMessage(message);
    });

    client.on('error', (error) => {
        console.log(error)
    })
}

async function handleMessage(message) {
    try {
        const msg = JSON.parse(message.toString());
        await mongoCollection.insertOne({...msg, timestamp: getTime()});
        console.log("Inserted message into MongoDB:", msg);
        sendToAll(JSON.stringify(msg))
    } catch (error) {
        console.error("Error handling MQTT message:", error);
    }
}

function getTime() {
    const utcDate = new Date();
    utcDate.setHours(utcDate.getHours() + 8);
    return utcDate;
}
