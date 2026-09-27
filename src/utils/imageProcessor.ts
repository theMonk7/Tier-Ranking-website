const THUMB_SIZE = 128;

export async function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('File too large (max 10MB)'));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = THUMB_SIZE;
      canvas.height = THUMB_SIZE;
      const ctx = canvas.getContext('2d')!;

      // Center-crop to square
      const sourceSize = Math.min(img.width, img.height);
      const offsetX = (img.width - sourceSize) / 2;
      const offsetY = (img.height - sourceSize) / 2;

      ctx.drawImage(
        img,
        offsetX, offsetY, sourceSize, sourceSize,
        0, 0, THUMB_SIZE, THUMB_SIZE
      );

      URL.revokeObjectURL(url);

      const dataUrl = canvas.toDataURL('image/webp', 0.85);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
