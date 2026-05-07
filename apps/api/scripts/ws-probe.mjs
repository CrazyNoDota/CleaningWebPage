import { io } from 'socket.io-client';

const [, , token, orderId, label] = process.argv;
const sock = io('http://localhost:4000/realtime', {
  auth: token ? { token } : undefined,
  transports: ['websocket'],
  reconnection: false,
});

sock.on('connect', () => {
  console.log(`[${label}] connected`);
  if (orderId) {
    sock.emit('subscribe-order', { orderId }, (ack) => {
      console.log(`[${label}] subscribe ack`, JSON.stringify(ack));
      sock.disconnect();
    });
  } else {
    sock.disconnect();
  }
});
sock.on('connect_error', (e) => {
  console.log(`[${label}] connect_error: ${e.message}`);
  process.exit(0);
});
sock.on('error', (e) => console.log(`[${label}] error: ${JSON.stringify(e)}`));
sock.on('disconnect', (reason) => {
  console.log(`[${label}] disconnect: ${reason}`);
  process.exit(0);
});
setTimeout(() => process.exit(0), 4000);
