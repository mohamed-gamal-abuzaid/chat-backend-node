import { Router, Request, Response } from 'express';
import { uploadMemory, UploadService } from '../services/upload.service';

const router = Router();
const uploadService = new UploadService();

router.post('/upload', uploadMemory.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await uploadService.uploadToRustFS(req.file);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('RustFS Upload Error:', error);
    return res.status(500).json({ error: 'Failed to upload media to RustFS' });
  }
});

export default router;