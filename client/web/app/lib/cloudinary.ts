export type ResourceType = 'image' | 'video' | 'raw' | 'auto'

export interface UploadResult {
  secureUrl: string
  publicId: string
  format: string
  bytes: number
  width?: number
  height?: number
}

export class CloudinaryError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'CloudinaryError'
  }
}

export interface UploadOptions {
  folder?: string
  resourceType?: ResourceType
  onProgress?: (percent: number) => void
}

/**
 * Unsigned browser upload to Cloudinary (client-only). Mirrors the mobile uploader
 * but takes a File/Blob from an <input type="file"> or a canvas/webcam capture.
 */
export function uploadToCloudinary(file: File | Blob, opts: UploadOptions = {}): Promise<UploadResult> {
  const config = useRuntimeConfig()
  const cloud = config.public.cloudinaryCloudName
  const preset = config.public.cloudinaryUploadPreset
  if (!cloud || !preset) {
    return Promise.reject(new CloudinaryError('Cloudinary is not configured', 0))
  }

  const resourceType = opts.resourceType ?? 'image'
  const url = `https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/upload`

  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', preset)
  if (opts.folder) form.append('folder', opts.folder)

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    if (opts.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) opts.onProgress!(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve({
            secureUrl: data.secure_url,
            publicId: data.public_id,
            format: data.format,
            bytes: data.bytes,
            width: data.width,
            height: data.height,
          })
        } catch {
          reject(new CloudinaryError('Invalid response from Cloudinary', xhr.status))
        }
      } else {
        let msg = `Upload failed (${xhr.status})`
        try {
          const body = JSON.parse(xhr.responseText)
          if (body?.error?.message) msg = body.error.message
        } catch {
          // not JSON
        }
        reject(new CloudinaryError(msg, xhr.status))
      }
    }
    xhr.onerror = () => reject(new CloudinaryError('Network error during upload', 0))
    xhr.ontimeout = () => reject(new CloudinaryError('Upload timed out', 0))
    xhr.send(form)
  })
}
