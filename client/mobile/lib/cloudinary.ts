const CLOUD = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const ROOT_FOLDER = process.env.EXPO_PUBLIC_CLOUDINARY_FOLDER;

if (!CLOUD || !PRESET) {
  throw new Error('Cloudinary env vars (CLOUD_NAME, UPLOAD_PRESET) missing');
}

export type ResourceType = 'image' | 'video' | 'raw' | 'auto';

export type UploadOptions = {
  uri: string;
  /** sub-folder under EXPO_PUBLIC_CLOUDINARY_FOLDER (e.g. "verification/id") */
  folder?: string;
  resourceType?: ResourceType;
  /** mime type — defaults vary by resourceType */
  mimeType?: string;
  /** filename suggestion sent to Cloudinary */
  fileName?: string;
  onProgress?: (percent: number) => void;
};

export type UploadResult = {
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  resourceType: ResourceType;
  width?: number;
  height?: number;
};

export class CloudinaryError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'CloudinaryError';
  }
}

export function uploadToCloudinary(opts: UploadOptions): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const resourceType = opts.resourceType ?? 'image';
    const url = `https://api.cloudinary.com/v1_1/${CLOUD}/${resourceType}/upload`;

    const folder = opts.folder
      ? ROOT_FOLDER
        ? `${ROOT_FOLDER}/${opts.folder}`
        : opts.folder
      : ROOT_FOLDER;

    const form = new FormData();
    form.append('file', {
      uri: opts.uri,
      name: opts.fileName ?? 'upload',
      type: opts.mimeType ?? (resourceType === 'image' ? 'image/jpeg' : 'application/octet-stream'),
    } as unknown as Blob);
    form.append('upload_preset', PRESET as string);
    if (folder) form.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (opts.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          opts.onProgress!(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            secureUrl: data.secure_url,
            publicId: data.public_id,
            format: data.format,
            bytes: data.bytes,
            resourceType: (data.resource_type ?? resourceType) as ResourceType,
            width: data.width,
            height: data.height,
          });
        } catch {
          reject(new CloudinaryError('Invalid response from Cloudinary', xhr.status));
        }
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body?.error?.message) msg = body.error.message;
        } catch {
          // body wasn't JSON
        }
        reject(new CloudinaryError(msg, xhr.status));
      }
    };

    xhr.onerror = () => reject(new CloudinaryError('Network error during upload', 0));
    xhr.ontimeout = () => reject(new CloudinaryError('Upload timed out', 0));

    xhr.send(form);
  });
}
