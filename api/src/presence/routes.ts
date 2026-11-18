import { Router } from 'express';
import { getMembers } from './services/getMembers.ts';
import { heartbeat } from './services/heartbeat.ts';
import { joinRoom } from './services/joinRoom.ts';
import { leaveRoom } from './services/leaveRoom.ts';

/** A caller only ever acts on a room's membership as themselves (`me`). */
export const presenceRoutes = Router();
presenceRoutes.get('/rooms/:roomId/members', getMembers);
presenceRoutes.put('/rooms/:roomId/members/me', joinRoom);
presenceRoutes.post('/rooms/:roomId/members/me/heartbeat', heartbeat);
presenceRoutes.delete('/rooms/:roomId/members/me', leaveRoom);
