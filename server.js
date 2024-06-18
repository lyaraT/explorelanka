// server.js
const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

let subscribedStops = [];

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('message', (message) => {
    const { action, stopId } = JSON.parse(message);
    if (action === 'subscribe') {
      if (!subscribedStops.includes(stopId)) {
        subscribedStops.push(stopId);
      }
    } else if (action === 'unsubscribe') {
      subscribedStops = subscribedStops.filter(id => id !== stopId);
    }
  });
});

const fetchBusData = async () => {
  try {
    // Replace with your actual API endpoint
    const response = await axios.get('https://api.example.com/bus-data');
    const busData = response.data;

    subscribedStops.forEach(stopId => {
      const stopData = busData.filter(bus => bus.stopId === stopId);
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ stopId, stopData }));
        }
      });
    });
  } catch (error) {
    console.error('Error fetching bus data:', error);
  }
};

setInterval(fetchBusData, 5000);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
