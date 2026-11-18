import { Router } from 'express';
import { createRoom } from './services/createRoom.ts';
import { getRoom } from './services/getRoom.ts';
import { listRooms } from './services/listRooms.ts';
import { repointVideo } from './services/repointVideo.ts';
import { touchRoom } from './services/touchRoom.ts';
import { transferOwnership } from './services/transferOwnership.ts';
import { writePlayback } from './services/writePlayback.ts';

export const roomRoutes = Router();
roomRoutes.get('/rooms', listRooms);
roomRoutes.post('/rooms', createRoom);
roomRoutes.get('/rooms/:roomId', getRoom);
roomRoutes.put('/rooms/:roomId/playback', writePlayback);
roomRoutes.post('/rooms/:roomId/touch', touchRoom);
roomRoutes.put('/rooms/:roomId/video', repointVideo);
roomRoutes.post('/rooms/:roomId/ownership-transfers', transferOwnership);
