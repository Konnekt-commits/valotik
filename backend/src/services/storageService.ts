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

  // Retourne le chemin GCS (pas une URL publique)
  // L'URL signée sera générée à la demande
  return `gs://${BUCKET_NAME}/${filename}`;
};

// Génère une URL signée valide 1 heure pour accès sécurisé
export const getSignedUrl = async (gcsPath: string): Promise<string> => {
  try {
    // Extraire bucket et filename depuis gs://bucket/path
    const match = gcsPath.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (!match) {
      return gcsPath; // Retourne tel quel si pas un chemin GCS
    }

    const [, bucketName, filename] = match;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 heure
    });

    return signedUrl;
  } catch (error) {
    console.error('Erreur génération URL signée:', error);
    return gcsPath;
  }
};

export const deleteFromGCS = async (gcsPath: string): Promise<void> => {
  try {
    const match = gcsPath.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (!match) return;

    const [, bucketName, filename] = match;
    const bucket = storage.bucket(bucketName);
    await bucket.file(filename).delete();
  } catch (error) {
    console.error('Erreur suppression GCS:', error);
  }
};

// Stream un fichier depuis GCS
export const streamFromGCS = async (gcsPath: string): Promise<{ stream: NodeJS.ReadableStream; contentType: string } | null> => {
  try {
    const match = gcsPath.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (!match) return null;

    const [, bucketName, filename] = match;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);

    const [metadata] = await file.getMetadata();
    const stream = file.createReadStream();

    return {
      stream,
      contentType: metadata.contentType || 'application/octet-stream'
    };
  } catch (error) {
    console.error('Erreur stream GCS:', error);
    return null;
  }
};

export default { uploadToGCS, deleteFromGCS, getSignedUrl, streamFromGCS, BUCKET_NAME };
