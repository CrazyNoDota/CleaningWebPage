import { io } from 'socket.io-client';

const [, , token, orderId] = process.argv;
if (!token || !orderId) {
  console.error('usage: ws-listener.mjs <accessToken> <orderId>');
  process.exit(1);
}

const sock = io('http://localhost:4000/realtime', {
  auth: { token },
  transports: ['websocket'],
  reconnection: false,
});

sock.on('connect', () => {
  console.log(`[connected] sid=${sock.id}`);
  sock.emit('subscribe-order', { orderId }, (ack) => {
    console.log('[subscribe ack]', JSON.stringify(ack));
  });
});

sock.on('order.updated', (msg) => {
  console.log('[order.updated]', JSON.stringify(msg));
});

sock.on('connect_error', (e) => console.error('[connect_error]', e.message));
sock.on('error', (e) => console.error('[error]', JSON.stringify(e)));
sock.on('disconnect', (reason) => {
  console.log(`[disconnect] ${reason}`);
  process.exit(0);
});

setTimeout(() => {
  console.log('[timeout] exiting');
  sock.disconnect();
}, 15000);
