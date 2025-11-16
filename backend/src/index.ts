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
  const clients = wsServer.clients;
  wsClient.userIndex = null;
  wsClient.on('message', (message: RawData) => {
    try {
      data = message.toString();
    } catch (err) {
      console.log(err);
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

    res.map(({ response, broadcast }: any) => {
      if (response.type === 'reg') {
        const index = response.data?.index;
        wsClient.userIndex = index;
        userConnections.set(index, wsClient);
      }
      try {
        let outgoingData = response.data ?? '{}';
        if (typeof outgoingData !== 'string') {
          outgoingData = JSON.stringify(outgoingData);
        }
        wsClient.send(
          JSON.stringify({
            ...response,
            data: outgoingData,
          })
        );
        if (broadcast) {
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
