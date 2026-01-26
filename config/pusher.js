import Pusher from 'pusher';
import dotenv from 'dotenv';

dotenv.config();

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'ap2', // Default to ap2 or generic
  useTLS: true
});

export default pusher;
