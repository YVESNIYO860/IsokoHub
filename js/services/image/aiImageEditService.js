(function () {
  const MAX_IMAGE_DIMENSION = 504;

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not prepare this image.'));
      reader.readAsDataURL(blob);
    });
  }

  function dataUrlToBlob(dataUrl, type = 'image/png') {
    const base64 = String(dataUrl || '').split(',').pop();
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type });
  }

  async function prepareImage(source) {
    const image = await ImageStudioImageUtils.loadImage(source);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = ImageStudioImageUtils.createCanvas(
      Math.round(image.naturalWidth * scale),
      Math.round(image.naturalHeight * scale)
    );
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await ImageStudioImageUtils.canvasToBlob(canvas, 'image/jpeg', 0.86);
    const outputScale = 2;
    const outputDimension = (value) => Math.max(256, Math.round((value * outputScale) / 8) * 8);
    return {
      image: await blobToDataUrl(blob),
      width: outputDimension(canvas.width),
      height: outputDimension(canvas.height)
    };
  }

  const service = {
    async edit(source, prompt) {
      const session = window.supabase?.auth?.session?.();
      if (!session?.access_token) {
        throw new Error('Sign in to use AI image editing.');
      }

      const cleanPrompt = String(prompt || '').trim();
      if (!cleanPrompt || cleanPrompt.length > 500) {
        throw new Error('Enter an edit prompt between 1 and 500 characters.');
      }

      const prepared = await prepareImage(source);
      const response = await fetch('/api/image-edit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: prepared.image,
          prompt: cleanPrompt,
          width: prepared.width,
          height: prepared.height
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'AI image editing is unavailable.');
      }

      if (typeof result.image !== 'string') {
        throw new Error('The image service returned an invalid result.');
      }
      return dataUrlToBlob(`data:${result.type || 'image/png'};base64,${result.image}`, result.type || 'image/png');
    }
  };

  window.aiImageEditService = service;
})();