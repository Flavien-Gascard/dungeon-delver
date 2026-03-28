import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createRoom, getRoom, listRooms } from '../roomStore';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(listRooms());
});

router.post('/', async (req: Request, res: Response) => {
  const { name, dmPassword, playerPassword } = req.body as {
    name?: string;
    dmPassword?: string;
    playerPassword?: string;
  };

  if (!name || !dmPassword || !playerPassword) {
    res.status(400).json({ error: 'name, dmPassword and playerPassword are required' });
    return;
  }

  const id = uuidv4().slice(0, 8).toUpperCase();
  const room = await createRoom(id, name.trim(), dmPassword, playerPassword);

  res.status(201).json({ id: room.id, name: room.name });
});

router.get('/:roomId', (req: Request, res: Response) => {
  const room = getRoom(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({ id: room.id, name: room.name, gridSize: room.gridSize });
});

export default router;
