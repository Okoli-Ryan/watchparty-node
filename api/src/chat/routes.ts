import { Router } from 'express';
import { listMessages } from './services/listMessages.ts';
import { postMessage } from './services/postMessage.ts';

/** Encrypted room chat. The server stores and relays ciphertext; it never holds a key. */
export const chatRoutes = Router();
chatRoutes.get('/rooms/:roomId/messages', listMessages);
chatRoutes.post('/rooms/:roomId/messages', postMessage);
