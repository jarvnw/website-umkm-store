
export interface ImageKitResponse {
  url: string;
  fileId: string;
  name: string;
  size: number;
  filePath: string;
}

const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env[key] || '';
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) return process.env[key] || '';
  } catch (e) {}
  return '';
};

export const imageService = {
  /**
   * Fetches authentication parameters from the backend serverless function.
   */
  async getAuthParams() {
    try {
      const response = await fetch('/api/auth');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch auth params');
      }
      return await response.json();
    } catch (error: any) {
      console.error('Auth Param Error:', error);
      throw new Error('Gagal mendapatkan izin upload dari server.');
    }
  },

  /**
   * Performs direct client-side upload to ImageKit via XHR.
   */
  upload(file: File, onProgress?: (percent: number) => void): Promise<ImageKitResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        const auth = await this.getAuthParams();
        const publicKey = getEnv('VITE_IMAGEKIT_PUBLIC_KEY');

        if (!publicKey) {
          return reject(new Error('VITE_IMAGEKIT_PUBLIC_KEY belum dikonfigurasi di environment.'));
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name || `media_${Date.now()}`);
        formData.append('publicKey', publicKey);
        formData.append('signature', auth.signature);
        formData.append('expire', auth.expire.toString());
        formData.append('token', auth.token);
        formData.append('useUniqueFileName', 'true');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload', true);

        if (onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Respon server tidak valid.'));
            }
          } else {
            reject(new Error(xhr.responseText || `Upload gagal (Status: ${xhr.status})`));
          }
        };

        xhr.onerror = () => reject(new Error('Kesalahan jaringan saat mengunggah media.'));
        xhr.send(formData);
      } catch (err) {
        reject(err);
      }
    });
  }
};
