import { Storage } from '@google-cloud/storage';
import path from 'path';

const storage = new Storage();
const BUCKET_NAME = 'run-sources-valotik-484917-europe-west1';

export const uploadToGCS = async (
  file: Express.Multer.File,
  folder: string = 'insertion-documents'
): Promise<string> => {
  const bucket = storage.bucket(BUCKET_NAME);

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `${folder}/${baseName}-${uniqueSuffix}${ext}`;

  const blob = bucket.file(filename);

  await blob.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
  });

  // Rendre le fichier public ou retourner une URL signée
  // Pour simplifier, on retourne l'URL publique
  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;

  return publicUrl;
};

export const deleteFromGCS = async (fileUrl: string): Promise<void> => {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    // Extraire le chemin du fichier depuis l'URL
    const filePath = fileUrl.replace(`https://storage.googleapis.com/${BUCKET_NAME}/`, '');
    await bucket.file(filePath).delete();
  } catch (error) {
    console.error('Erreur suppression GCS:', error);
  }
};

export default { uploadToGCS, deleteFromGCS, BUCKET_NAME };
