import { RequestIncoming } from '@app/model/request.ts';
import { Router } from '@app/router.ts';
import ws, { RawData, WebSocketServer } from 'ws';

const DEFAULT_PORT = 3000;
const PORT = +(process.env.PORT || DEFAULT_PORT);
const wsServer = new WebSocketServer({ port: PORT });

const userConnections = new Map<string, WebSocket>();

wsServer.on('connection', (wsClient: any) => {
  const router = new Router();
  let data = '';
  console.log(wsClient, 'wsClient');
  const clients = wsServer.clients;
  wsClient.userIndex = null;
  wsClient.on('message', (message: RawData) => {
    try {
      data = message.toString();
    } catch (err) {
      console.log(err, 888);
    }

    const parsedData: RequestIncoming<any> = JSON.parse(data);
    let fixedData = parsedData.data;

    if (typeof fixedData === 'string' && fixedData?.length) {
      try {
        fixedData = JSON.parse(fixedData);
      } catch {
        console.log('Error in parsing');
      }
    }

    const res = router.defineRoute({
      ...parsedData,
      data: fixedData,
      userIndex: wsClient.userIndex,
    });

    if (res?.response?.type === 'reg') {
      const index = res?.response?.data?.index;
      wsClient.userIndex = index;
      userConnections.set(index, wsClient)
      console.log(wsClient.userIndex, 'userIndex');
    }
    try {
      let outgoingData = res?.response?.data ?? '{}';
      const data = JSON.stringify(res?.response);
      if (typeof outgoingData !== 'string') {
        outgoingData = JSON.stringify(outgoingData);
      }

      wsClient.send(
        JSON.stringify({
          ...res?.response,
          data: outgoingData,
        })
      );

      if (res?.broadcast) {
        clients.forEach((client) => {
          if (client !== wsClient && client.readyState === WebSocket.OPEN) {
            client.send(outgoingData);
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  });

  wsClient.on('close', () => {
    const index = wsClient.userIndex;
    if (index) userConnections.delete(index);
    console.log('Bye!');
  });

  wsClient.on('error', (error: Error) => {
    console.log(`Error: ${error}`);
  });
});

console.log(`Server start on ws://localhost:${PORT}`);
