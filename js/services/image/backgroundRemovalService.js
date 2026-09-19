(function () {
  const developmentEdgeAdapter = {
    name: 'Development edge-removal adapter',
    async removeBackground(source) {
      const image = await ImageStudioImageUtils.loadImage(source);
      const canvas = ImageStudioImageUtils.createCanvas(image.naturalWidth, image.naturalHeight);
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      const visited = new Uint8Array(width * height);
      const queue = [];
      const samples = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
      const background = [0, 0, 0];

      samples.forEach(([x, y]) => {
        const index = (y * width + x) * 4;
        background[0] += pixels[index];
        background[1] += pixels[index + 1];
        background[2] += pixels[index + 2];
      });
      background[0] /= samples.length;
      background[1] /= samples.length;
      background[2] /= samples.length;

      const addPixel = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        const position = y * width + x;
        if (visited[position]) return;
        const index = position * 4;
        const distance = Math.hypot(
          pixels[index] - background[0],
          pixels[index + 1] - background[1],
          pixels[index + 2] - background[2]
        );
        if (distance > 58 || pixels[index + 3] === 0) return;
        visited[position] = 1;
        queue.push(position);
      };

      for (let x = 0; x < width; x += 1) {
        addPixel(x, 0);
        addPixel(x, height - 1);
      }
      for (let y = 1; y < height - 1; y += 1) {
        addPixel(0, y);
        addPixel(width - 1, y);
      }
      for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const position = queue[cursor];
        pixels[position * 4 + 3] = 0;
        const x = position % width;
        const y = Math.floor(position / width);
        addPixel(x - 1, y);
        addPixel(x + 1, y);
        addPixel(x, y - 1);
        addPixel(x, y + 1);
      }

      context.putImageData(imageData, 0, 0);
      return ImageStudioImageUtils.canvasToBlob(canvas, 'image/png');
    }
  };

  const service = {
    adapter: developmentEdgeAdapter,
    configure(adapter) {
      if (!adapter || typeof adapter.removeBackground !== 'function') {
        throw new Error('Background removal adapter must expose removeBackground(source).');
      }
      service.adapter = adapter;
    },
    async removeBackground(source) {
      return service.adapter.removeBackground(source);
    },
    getAdapterName() {
      return service.adapter.name || 'Configured adapter';
    }
  };

  window.backgroundRemovalService = service;
})();
