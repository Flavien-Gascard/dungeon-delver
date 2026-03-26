import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createRoom, getRoom, listRooms } from '../roomStore';

const router = Router();

// List all rooms (id + name only)
router.get('/', (_req: Request, res: Response) => {
  res.json(listRooms());
});

// Create a room
router.post('/', (req: Request, res: Response) => {
  const { name, dmPassword } = req.body as { name?: string; dmPassword?: string };

  if (!name || !dmPassword) {
    res.status(400).json({ error: 'name and dmPassword are required' });
    return;
  }

  const id = uuidv4().slice(0, 8).toUpperCase();
  const room = createRoom(id, name.trim(), dmPassword);

  res.status(201).json({ id: room.id, name: room.name });
});

// Get a room (public info — no password, no fog details)
router.get('/:roomId', (req: Request, res: Response) => {
  const room = getRoom(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({ id: room.id, name: room.name, gridSize: room.gridSize });
});

export default router;
