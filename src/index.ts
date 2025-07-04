import dotenv from 'dotenv';

dotenv.config({ path: './src/config/config.env' }); //load env vars

import app from './app';
import connectDB from './config/db.config';
import http from 'http';
import { socketService } from './sockets/socketService';

//server setup
const PORT = process.env.PORT || 8000;

const server = http.createServer(app);
socketService.initialize(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
