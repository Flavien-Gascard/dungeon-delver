import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { getRoom, initFog, verifyDmPassword } from '../roomStore';

const router = Router();

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

function makeStorage(subfolder: string) {
  return multer.diskStorage({
    destination: path.join(UPLOADS_DIR, subfolder),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}${ext}`);
    },
  });
}

const mapUpload = multer({
  storage: makeStorage('maps'),
  fileFilter: (_req, file, cb) => {
    cb(null, /image\/(jpeg|png|webp|gif)/.test(file.mimetype));
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

const tokenUpload = multer({
  storage: makeStorage('tokens'),
  fileFilter: (_req, file, cb) => {
    cb(null, /image\/(jpeg|png|webp|gif)/.test(file.mimetype));
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

// POST /api/upload/:roomId/map  (DM only)
router.post('/:roomId/map', mapUpload.single('map'), async (req: Request, res: Response) => {
  const room = getRoom(req.params.roomId);
  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }

  const { dmPassword, gridSize } = req.body as { dmPassword?: string; gridSize?: string };
  const valid = dmPassword ? await verifyDmPassword(room, dmPassword) : false;
  if (!valid) { res.status(403).json({ error: 'Invalid DM password' }); return; }
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }

  room.mapImage = req.file.filename;

  const size = parseInt(gridSize ?? '50', 10);
  room.gridSize = isNaN(size) ? 50 : size;

  // Fog grid will be initialized once we know image dimensions.
  // The client sends cols/rows after it loads the image.
  res.json({ mapImage: room.mapImage, gridSize: room.gridSize });
});

// POST /api/upload/:roomId/fog-init  — client tells us the grid dimensions after image loads
router.post('/:roomId/fog-init', async (req: Request, res: Response) => {
  const room = getRoom(req.params.roomId);
  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }

  const { dmPassword, cols, rows } = req.body as { dmPassword?: string; cols?: number; rows?: number };
  const valid = dmPassword ? await verifyDmPassword(room, dmPassword) : false;
  if (!valid) { res.status(403).json({ error: 'Invalid DM password' }); return; }
  if (!cols || !rows) { res.status(400).json({ error: 'cols and rows required' }); return; }

  initFog(room, cols, rows);
  res.json({ fogCols: room.fogCols, fogRows: room.fogRows });
});

// POST /api/upload/:roomId/token/:tokenId
router.post('/:roomId/token/:tokenId', tokenUpload.single('image'), (req: Request, res: Response) => {
  const room = getRoom(req.params.roomId);
  if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }

  const token = room.tokens.get(req.params.tokenId);
  if (!token) { res.status(404).json({ error: 'Token not found' }); return; }

  token.imageUrl = `/uploads/tokens/${req.file.filename}`;
  res.json({ imageUrl: token.imageUrl });
});

export default router;
