import { ApiClient } from './api';
import { FILE_UPLOAD_CHUNK_SIZE } from './constants';

export interface UploadProgress {
  fileName: string;
  bytesUploaded: number;
  totalBytes: number;
  progress: number; // 0–1
}

export async function uploadFile(
  file: File,
  sessionId: string,
  sessionDirectory: string,
  client: ApiClient,
  onProgress?: (progress: UploadProgress) => void,
): Promise<string> {
  const totalChunks = Math.ceil(file.size / FILE_UPLOAD_CHUNK_SIZE);
  let filePath = '';

  for (let i = 0; i < totalChunks; i++) {
    const start = i * FILE_UPLOAD_CHUNK_SIZE;
    const end = Math.min(start + FILE_UPLOAD_CHUNK_SIZE, file.size);
    const blob = file.slice(start, end);

    const base64 = await blobToBase64(blob);

    const result = await client.uploadFile(
      sessionId,
      sessionDirectory,
      file.name,
      base64,
      i,
      totalChunks,
    );

    filePath = result.file_path;

    onProgress?.({
      fileName: file.name,
      bytesUploaded: end,
      totalBytes: file.size,
      progress: end / file.size,
    });
  }

  return filePath;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip "data:*/*;base64," prefix
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
