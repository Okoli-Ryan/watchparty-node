import { Router } from 'express';
import { getHistoryEntry } from './services/getHistoryEntry.ts';
import { listHistory } from './services/listHistory.ts';
import { markRead } from './services/markRead.ts';
import { removeFromHistory } from './services/removeFromHistory.ts';
import { setFavourite } from './services/setFavourite.ts';

/** The caller's own history. Every route is under /me: there is no route to anyone else's. */
export const historyRoutes = Router();
historyRoutes.get('/me/history', listHistory);
historyRoutes.get('/me/history/:roomId', getHistoryEntry);
historyRoutes.put('/me/history/:roomId/favourite', setFavourite);
historyRoutes.put('/me/history/:roomId/read-position', markRead);
historyRoutes.delete('/me/history/:roomId', removeFromHistory);
