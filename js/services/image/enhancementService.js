(function () {
  const localEnhancementAdapter = {
    name: 'Development canvas enhancement adapter',
    async enhance(source, options = {}) {
      const image = await ImageStudioImageUtils.loadImage(source);
      const scale = Math.max(1, Math.min(Number(options.scale) || 1, 4));
      const canvas = ImageStudioImageUtils.createCanvas(
        Math.min(2400, Math.round(image.naturalWidth * scale)),
        Math.min(2400, Math.round(image.naturalHeight * scale))
      );
      const context = canvas.getContext('2d');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.filter = `brightness(${options.lighting || 104}%) contrast(${options.contrast || 108}%) saturate(${options.saturation || 105}%)`;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      context.filter = 'none';
      return ImageStudioImageUtils.canvasToBlob(canvas, options.type || 'image/png', options.quality);
    }
  };

  const service = {
    adapter: localEnhancementAdapter,
    configure(adapter) {
      if (!adapter || typeof adapter.enhance !== 'function') {
        throw new Error('Enhancement adapter must expose enhance(source, options).');
      }
      service.adapter = adapter;
    },
    async enhanceImage(source, options = {}) {
      return service.adapter.enhance(source, options);
    },
    getAdapterName() {
      return service.adapter.name || 'Configured adapter';
    }
  };

  window.enhancementService = service;
})();
