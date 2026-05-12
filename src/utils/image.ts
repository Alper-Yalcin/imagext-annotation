export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export function isSupportedImageFile(file: File): boolean {
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const isMimeSupported = supportedTypes.includes(file.type);
  
  const extension = file.name.split('.').pop()?.toLowerCase();
  const isExtSupported = ['jpg', 'jpeg', 'png', 'webp'].includes(extension || '');
  
  return isMimeSupported || isExtSupported;
}
