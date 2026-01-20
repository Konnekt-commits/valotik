import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import documentController from '../controllers/documentController';

const router = Router();

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

// Routes pour les documents
router.get('/case-files/:caseFileId/documents', documentController.getByCaseFile.bind(documentController));
router.post('/case-files/:caseFileId/documents', upload.single('file'), documentController.upload.bind(documentController));
router.post('/case-files/:caseFileId/documents/generated', documentController.saveGenerated.bind(documentController));
router.delete('/documents/:id', documentController.delete.bind(documentController));

export default router;
