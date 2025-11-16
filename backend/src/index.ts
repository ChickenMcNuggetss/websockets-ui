import { RequestIncoming } from '@app/model/request.ts';
import { Router } from '@app/router.ts';
import ws, { RawData, WebSocketServer } from 'ws';

const DEFAULT_PORT = 3000;
const PORT = +(process.env.PORT || DEFAULT_PORT);
const wsServer = new WebSocketServer({ port: PORT });

wsServer.on('connection', (wsClient) => {
  const router = new Router();
  let data = '';
  const clients = wsServer.clients;
  wsClient.on('message', (message: RawData) => {
    try {
      data = message.toString();
    } catch (err) {
      console.log(err, 888);
    }

    const parsedData: RequestIncoming<any> = JSON.parse(data);
    let fixedData = parsedData.data;

    if (typeof fixedData === 'string') {
      try {
        fixedData = JSON.parse(fixedData);
      } catch {
        console.log('Error in parsing');
      }
    }

    const res = router.defineRoute({
      ...parsedData,
      data: fixedData,
    });

    try {
      let outgoingData = res.response.data;

      if (typeof outgoingData !== 'string') {
        outgoingData = JSON.stringify(outgoingData);
      }

      wsClient.send(
        JSON.stringify({
          ...res.response,
          data: outgoingData,
        })
      );
      wsClient.send(outgoingData);
      if (res.broadcast) {
        clients.forEach((client) => {
          if (client !== wsClient && client.readyState === WebSocket.OPEN) {
            client.send(outgoingData);
          }
        });
      }
    } catch (err) {
      console.log(err, 66);
    }
  });

  wsClient.on('close', () => {
    console.log('Bye!');
  });

  wsClient.on('error', (error) => {
    console.log(`Error: ${error}`);
  });
});

console.log(`Server start on ws://localhost:${PORT}`);
