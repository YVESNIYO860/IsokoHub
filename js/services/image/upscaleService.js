(function () {
  const localUpscaleAdapter = {
    name: 'Development canvas upscale adapter',
    async upscale(source, options = {}) {
      const image = await ImageStudioImageUtils.loadImage(source);
      const scale = Math.max(1, Math.min(Number(options.scale) || 2, 4));
      const maxDimension = 3200;
      const ratio = Math.min(scale, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = ImageStudioImageUtils.createCanvas(
        Math.max(1, Math.round(image.naturalWidth * ratio)),
        Math.max(1, Math.round(image.naturalHeight * ratio))
      );
      const context = canvas.getContext('2d');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return ImageStudioImageUtils.canvasToBlob(canvas, options.type || 'image/png', options.quality);
    }
  };

  const service = {
    adapter: localUpscaleAdapter,
    configure(adapter) {
      if (!adapter || typeof adapter.upscale !== 'function') {
        throw new Error('Upscale adapter must expose upscale(source, options).');
      }
      service.adapter = adapter;
    },
    async upscaleImage(source, options = {}) {
      return service.adapter.upscale(source, options);
    },
    getAdapterName() {
      return service.adapter.name || 'Configured adapter';
    }
  };

  window.upscaleService = service;
})();
