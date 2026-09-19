(function () {
  const utils = {
    loadImage(source) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Unable to read this image.'));
        image.src = source instanceof Blob ? URL.createObjectURL(source) : source;
      });
    },
    createCanvas(width, height) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));
      return canvas;
    },
    canvasToBlob(canvas, type = 'image/png', quality) {
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Unable to create the processed image.'));
        }, type, quality);
      });
    },
    formatBytes(bytes) {
      if (!bytes) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB'];
      const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
      return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
    },
    fileFromBlob(blob, name = 'isokohub-image.png') {
      return new File([blob], name, { type: blob.type, lastModified: Date.now() });
    }
  };
  window.ImageStudioImageUtils = utils;
})();
