const WebSocket = require('ws');

const port = 3001
// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port }, () => console.log('server is listening on ', port));

// 客户端订阅的主题列表
const subscriptions = {};

// 监听连接事件
wss.on('connection', ws => {
    console.log('Client connected');

    // 监听客户端消息
    ws.on('message', message => {
        console.log(`Received message from client: ${message}`);
        const data = JSON.parse(message);

        // 如果消息中包含订阅动作，则记录客户端订阅的主题
        if (data.action === 'subscribe') {
            const topic = data.topic;
            if (!subscriptions[topic]) {
                subscriptions[topic] = new Set();
            }
            subscriptions[topic].add(ws);
            console.log(`Client subscribed to topic: ${topic}`);
        }

        // 如果消息中包含取消订阅动作，则取消客户端对该主题的订阅
        if (data.action === 'unsubscribe') {
            const topic = data.topic;
            if (subscriptions[topic]) {
                subscriptions[topic].delete(ws);
                console.log(`Client unsubscribed from topic: ${topic}`);
            }
        }
    });

    // 监听断开连接事件
    ws.on('close', () => {
        console.log('Client disconnected');

        // 在断开连接时，取消客户端对所有主题的订阅
        Object.values(subscriptions).forEach(set => {
            set.delete(ws);
        });
    });
});

// 向特定主题的订阅者发送消息
function sendMessageToTopic(topic, message) {
    if (subscriptions[topic]) {
        subscriptions[topic].forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}

// 定时向特定主题发送消息
setInterval(() => {
    const topic = 'sensor/001/001'; // 更改为你要发送消息的主题
    const message = 'Hello from server!';
    sendMessageToTopic(topic, JSON.stringify({msg: 'hello'}));
}, 200);

// 在收到终止信号时关闭服务器
process.on('SIGINT', () => {
    wss.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
