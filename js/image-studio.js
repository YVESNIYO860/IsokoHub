(function () {
  const MAX_FILE_BYTES = 12 * 1024 * 1024;
  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const DEV_DOWNLOAD_MODE = true;
  const state = {
    originalFile: null,
    currentBlob: null,
    currentUrl: '',
    image: null,
    tool: 'editor',
    rotation: 0,
    flip: false,
    crop: 'original',
    zoom: 1,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sharpness: 0,
    filter: 'none',
    backgroundResult: null,
    enhancementResult: null,
    compressionResult: null
  };

  const $ = (selector) => document.querySelector(selector);
  const workspace = $('#studio-workspace');
  const uploadZone = $('#studio-upload-zone');
  const fileInput = $('#studio-file-input');
  const canvas = $('#studio-canvas');
  const context = canvas.getContext('2d');
  const panel = $('#studio-tool-panel');
  const errorBox = $('#studio-error');
  const status = $('#studio-status');
  const downloadButton = $('#studio-download');
  const compareWrap = $('#studio-compare-wrap');
  const historySection = $('#studio-history');

  function setError(message = '') {
    errorBox.textContent = message;
    errorBox.style.display = message ? 'block' : 'none';
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function enterFullEditor() {
    const workspaceElement = document.querySelector('.studio-workspace');
    if (!workspaceElement) return;
    if (document.fullscreenElement === workspaceElement || workspaceElement.classList.contains('is-expanded')) return;
    if (workspaceElement.requestFullscreen) {
      workspaceElement.requestFullscreen().catch(() => workspaceElement.classList.toggle('is-expanded'));
    } else {
      workspaceElement.classList.toggle('is-expanded');
    }
  }

  function togglePreviewFullscreen() {
    const workspaceElement = document.querySelector('.studio-workspace');
    if (!workspaceElement) return;
    if (document.fullscreenElement === workspaceElement) {
      document.exitFullscreen?.();
      return;
    }
    if (workspaceElement.classList.contains('is-expanded')) {
      workspaceElement.classList.remove('is-expanded');
      return;
    }
    enterFullEditor();
  }

  function setBusy(message) {
    setStatus(message);
    panel.querySelectorAll('button, input, select').forEach((control) => { control.disabled = true; });
  }

  function clearBusy(message = 'Ready') {
    panel.querySelectorAll('button, input, select').forEach((control) => { control.disabled = false; });
    setStatus(message);
  }

  function getCropDimensions(image) {
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const ratio = state.crop === 'original' ? sourceWidth / sourceHeight : Number(state.crop);
    let width = sourceWidth;
    let height = sourceHeight;
    if (sourceWidth / sourceHeight > ratio) width = sourceHeight * ratio;
    else height = sourceWidth / ratio;
    const zoom = Math.max(1, state.zoom);
    return { width: width / zoom, height: height / zoom };
  }

  function applyFilter() {
    if (state.filter === 'mono') return 'grayscale(1)';
    if (state.filter === 'warm') return 'sepia(0.22) saturate(1.15)';
    if (state.filter === 'cool') return 'saturate(0.95) hue-rotate(8deg)';
    return '';
  }

  function renderCanvas(targetCanvas = canvas) {
    if (!state.image) return;
    const image = state.image;
    const crop = getCropDimensions(image);
    const maxDimension = 1800;
    const scale = Math.min(1, maxDimension / Math.max(crop.width, crop.height));
    const outputWidth = Math.max(1, Math.round(crop.width * scale));
    const outputHeight = Math.max(1, Math.round(crop.height * scale));
    const quarterTurn = Math.abs(state.rotation % 180) === 90;
    targetCanvas.width = quarterTurn ? outputHeight : outputWidth;
    targetCanvas.height = quarterTurn ? outputWidth : outputHeight;
    const targetContext = targetCanvas.getContext('2d');
    targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    const sharpnessContrast = 100 + (state.sharpness * 0.12);
    targetContext.filter = `brightness(${state.brightness}%) contrast(${state.contrast + sharpnessContrast - 100}%) saturate(${state.saturation}%) ${applyFilter()}`;
    targetContext.save();
    targetContext.translate(targetCanvas.width / 2, targetCanvas.height / 2);
    targetContext.rotate(state.rotation * Math.PI / 180);
    targetContext.scale(state.flip ? -1 : 1, 1);
    targetContext.drawImage(image, (image.naturalWidth - crop.width) / 2, (image.naturalHeight - crop.height) / 2, crop.width, crop.height, -outputWidth / 2, -outputHeight / 2, outputWidth, outputHeight);
    targetContext.restore();
    targetContext.filter = 'none';
  }

  function updatePreview() {
    compareWrap.hidden = true;
    $('#studio-canvas-wrap').hidden = false;
    renderCanvas();
    state.currentBlob = null;
    downloadButton.disabled = false;
  }

  function resetEdits() {
    state.rotation = 0; state.flip = false; state.crop = 'original'; state.zoom = 1;
    state.brightness = 100; state.contrast = 100; state.saturation = 100; state.sharpness = 0; state.filter = 'none';
    updatePreview();
    renderToolPanel();
  }

  function makeControl(label, key, min, max, step = 1) {
    return `<label class="studio-control">${label} <output data-output="${key}">${state[key]}%</output><input data-control="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${state[key]}"></label>`;
  }

  function renderToolPanel() {
    const templates = {
      editor: `<h2><i class="fa-solid fa-crop-simple" aria-hidden="true"></i> Image Editor</h2><p>Make quick, natural edits before sharing or listing.</p><label class="studio-control"><span><i class="fa-solid fa-crop-simple" aria-hidden="true"></i> Crop</span><select data-control="crop"><option value="original">Original</option><option value="1">Square 1:1</option><option value="0.8">Portrait 4:5</option><option value="1.7778">Landscape 16:9</option></select></label>${makeControl('Brightness', 'brightness', 70, 130)}${makeControl('Contrast', 'contrast', 70, 140)}${makeControl('Saturation', 'saturation', 0, 160)}${makeControl('Sharpness', 'sharpness', 0, 100)}<label class="studio-control"><span><i class="fa-solid fa-sliders" aria-hidden="true"></i> Filter</span><select data-control="filter"><option value="none">Original</option><option value="mono">Black and white</option><option value="warm">Warm</option><option value="cool">Cool</option></select></label><div class="studio-button-row"><button class="studio-secondary-button" data-action="undo" title="Undo last change"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i><span>Undo</span></button><button class="studio-secondary-button" data-action="redo" title="Redo last change"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i><span>Redo</span></button><button class="studio-secondary-button" data-action="reset" title="Reset edits"><i class="fa-solid fa-arrow-rotate-left" aria-hidden="true"></i><span>Reset</span></button></div>`,
      background: `<h2>🪄 Remove Background</h2><p>Prepare a clean product cutout. The replaceable adapter is currently running in local development mode.</p><button class="studio-download-button" data-action="background">Remove Background</button><label class="studio-control">Preview background<select data-control="backgroundColor"><option value="transparent">Transparent</option><option value="#ffffff">White</option><option value="#000000">Black</option><option value="#dbeafe">Custom Color</option></select></label><div class="studio-button-row"><button class="studio-secondary-button" data-action="custom-color">Choose custom color</button></div>`,
      enhance: `<h2>✨ Enhance Image</h2><p>Improve lighting and clarity with the local development enhancer, or connect a provider adapter later.</p><label class="studio-control">Enhancement strength<select data-control="enhanceStrength"><option value="1">Standard</option><option value="2">2x enhancement</option><option value="4">4x where supported</option></select></label><button class="studio-download-button" data-action="enhance">Enhance Image</button>`,
      product: `<h2><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> Product Photo</h2><p>Quick seller presets for marketplace-ready images.</p><div class="studio-button-row"><button class="studio-secondary-button" data-action="product-background"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span>Remove background</span></button><button class="studio-secondary-button" data-action="product-white"><i class="fa-solid fa-square" aria-hidden="true"></i><span>White background</span></button><button class="studio-secondary-button" data-action="product-light"><i class="fa-solid fa-sun" aria-hidden="true"></i><span>Improve lighting</span></button><button class="studio-secondary-button" data-action="product-sharpen"><i class="fa-solid fa-wand-magic" aria-hidden="true"></i><span>Sharpen product</span></button></div><label class="studio-control"><span><i class="fa-solid fa-expand" aria-hidden="true"></i> Preset size</span><select data-control="crop"><option value="1">1:1</option><option value="0.8">4:5</option><option value="1.7778">16:9</option></select></label><button class="studio-secondary-button" data-action="compress"><i class="fa-solid fa-compress" aria-hidden="true"></i><span>Compress for marketplace</span></button>`,
      compress: `<h2>🗜️ Compress Image</h2><p>Reduce file size while keeping the image practical for marketplace use.</p><label class="studio-control">Compression<select data-control="compression"><option value="0.55">Low</option><option value="0.75" selected>Medium</option><option value="0.9">High</option></select></label><div id="studio-size-result" class="studio-status">Original size: ${ImageStudioImageUtils.formatBytes(state.originalFile?.size || 0)}</div><button class="studio-download-button" data-action="compress">Compress Image</button>`
    };
    panel.innerHTML = templates[state.tool];
    bindToolPanel();
  }

  function bindToolPanel() {
    panel.querySelectorAll('[data-control]').forEach((control) => {
      control.addEventListener('input', handleControlChange);
      control.addEventListener('change', handleControlChange);
    });
    panel.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', handleAction));
  }

  function handleControlChange(event) {
    const key = event.currentTarget.dataset.control;
    if (key === 'crop') state.crop = event.currentTarget.value;
    else if (key === 'filter') state.filter = event.currentTarget.value;
    else if (['brightness', 'contrast', 'saturation', 'sharpness'].includes(key)) state[key] = Number(event.currentTarget.value);
    const output = panel.querySelector(`[data-output="${key}"]`);
    if (output) output.textContent = `${event.currentTarget.value}%`;
    updatePreview();
  }

  async function blobFromPreview(type = 'image/png', quality = 0.8) {
    renderCanvas();
    return ImageStudioImageUtils.canvasToBlob(canvas, type, quality);
  }

  async function handleAction(event) {
    const action = event.currentTarget.dataset.action;
    setError('');
    if (action === 'reset') return resetEdits();
    if (action === 'save') return saveCurrentChanges();
    if (action === 'undo' || action === 'redo') return setStatus(`${action === 'undo' ? 'Undo' : 'Redo'} history is ready for provider-backed editing.`);
    if (action === 'custom-color') return setStatus('Custom color preview is available after processing.');
    if (action === 'product-light') { state.brightness = 108; state.contrast = 106; updatePreview(); return; }
    if (action === 'product-sharpen') { state.sharpness = 70; state.contrast = 108; updatePreview(); return; }
    if (action === 'product-white') { state.crop = '1'; updatePreview(); return; }
    if (action === 'product-background') return processBackground();
    if (action === 'compress') return processCompression();
    if (action === 'enhance') return processEnhancement();
    if (action === 'background') return processBackground();
  }

  async function processBackground() {
    setBusy('🪄 Removing background...');
    try {
      state.backgroundResult = await window.backgroundRemovalService.removeBackground(state.currentBlob || state.originalFile);
      await showResult(state.backgroundResult, 'Background removed');
      const backgroundSelect = panel.querySelector('[data-control="backgroundColor"]');
      if (backgroundSelect) backgroundSelect.addEventListener('change', () => showBackgroundPreview(backgroundSelect.value));
    } catch (error) {
      setError('😕 Something went wrong. Try Again or choose another image.');
    } finally { clearBusy('Ready'); }
  }

  async function processEnhancement() {
    setBusy('✨ Enhancing image...');
    try {
      const scale = Number(panel.querySelector('[data-control="enhanceStrength"]')?.value || 1);
      state.enhancementResult = await window.enhancementService.enhanceImage(state.currentBlob || state.originalFile, { scale, type: 'image/png' });
      await showComparison(state.currentBlob || state.originalFile, state.enhancementResult, 'Enhancement preview');
    } catch (error) { setError('😕 Something went wrong. Try Again or choose another image.'); }
    finally { clearBusy('Ready'); }
  }

  async function processCompression() {
    setBusy('Compressing image...');
    try {
      const quality = Number(panel.querySelector('[data-control="compression"]')?.value || 0.75);
      const result = await blobFromPreview('image/jpeg', quality);
      state.compressionResult = result;
      const sizeResult = $('#studio-size-result');
      if (sizeResult) sizeResult.textContent = `Original size: ${ImageStudioImageUtils.formatBytes(state.originalFile.size)} · New size: ${ImageStudioImageUtils.formatBytes(result.size)} · Saved ${Math.max(0, Math.round((1 - result.size / state.originalFile.size) * 100))}%`;
      await showResult(result, 'Compressed image');
    } catch (error) { setError('😕 Something went wrong. Try Again or choose another image.'); }
    finally { clearBusy('Ready'); }
  }

  async function saveCurrentChanges() {
    setBusy('Saving changes...');
    try {
      state.currentBlob = await blobFromPreview('image/png', 1);
      await showResult(state.currentBlob, 'Changes saved');
    } catch (error) {
      setError('😕 Something went wrong. Try Again or choose another image.');
    } finally {
      clearBusy('Changes saved');
    }
  }

  async function showResult(blob, message) {
    state.currentBlob = blob;
    const url = URL.createObjectURL(blob);
    const resultImage = await ImageStudioImageUtils.loadImage(url);
    state.image = resultImage;
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = resultImage.naturalWidth;
    canvas.height = resultImage.naturalHeight;
    context.drawImage(resultImage, 0, 0);
    compareWrap.hidden = true;
    $('#studio-canvas-wrap').hidden = false;
    downloadButton.disabled = false;
    setStatus(message);
  }

  async function showBackgroundPreview(color) {
    if (!state.backgroundResult) return;
    const image = await ImageStudioImageUtils.loadImage(state.backgroundResult);
    const output = ImageStudioImageUtils.createCanvas(image.naturalWidth, image.naturalHeight);
    const outputContext = output.getContext('2d');
    if (color !== 'transparent') {
      outputContext.fillStyle = color;
      outputContext.fillRect(0, 0, output.width, output.height);
    }
    outputContext.drawImage(image, 0, 0);
    const blob = await ImageStudioImageUtils.canvasToBlob(output, color === 'transparent' ? 'image/png' : 'image/jpeg', 0.92);
    showResult(blob, `Background preview: ${color === 'transparent' ? 'transparent' : color}`);
  }

  async function showComparison(before, after, message) {
    const beforeImage = await ImageStudioImageUtils.loadImage(before);
    const afterImage = await ImageStudioImageUtils.loadImage(after);
    const beforeCanvas = $('#studio-before-canvas');
    const afterCanvas = $('#studio-after-canvas');
    beforeCanvas.width = beforeImage.naturalWidth; beforeCanvas.height = beforeImage.naturalHeight;
    afterCanvas.width = afterImage.naturalWidth; afterCanvas.height = afterImage.naturalHeight;
    beforeCanvas.getContext('2d').drawImage(beforeImage, 0, 0);
    afterCanvas.getContext('2d').drawImage(afterImage, 0, 0);
    $('#studio-after-layer').style.width = '50%';
    $('#studio-compare-range').value = 50;
    $('#studio-canvas-wrap').hidden = true;
    compareWrap.hidden = false;
    state.currentBlob = after;
    downloadButton.disabled = false;
    setStatus(message);
  }

  function loadFile(file) {
    setError('');
    if (!file || !ACCEPTED_TYPES.includes(file.type)) return setError('Choose a JPG, JPEG, PNG, or WEBP image.');
    if (file.size > MAX_FILE_BYTES) return setError('This image is larger than 12 MB. Please choose a smaller file.');
    state.originalFile = file;
    state.currentBlob = file;
    state.backgroundResult = null;
    state.enhancementResult = null;
    state.compressionResult = null;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { state.image = image; workspace.hidden = false; uploadZone.hidden = true; resetEdits(); renderHistory(); };
    image.onerror = () => setError('😕 Something went wrong. Choose another image.');
    image.src = url;
  }

  function renderHistory() {
    const entries = JSON.parse(localStorage.getItem('isokoHubImageStudioHistory') || '[]');
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user || !entries.length) { historySection.hidden = true; return; }
    historySection.hidden = false;
    $('#studio-history-grid').innerHTML = entries.slice(0, 6).map((entry) => `<div class="studio-history-item"><img src="${entry.url}" alt="Recent edit"><span>${entry.type}</span></div>`).join('');
  }

  function saveHistory(blob, type) {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) return;
    const entries = JSON.parse(localStorage.getItem('isokoHubImageStudioHistory') || '[]');
    const url = URL.createObjectURL(blob);
    entries.unshift({ url, type, createdAt: Date.now() });
    localStorage.setItem('isokoHubImageStudioHistory', JSON.stringify(entries.slice(0, 6)));
  }

  window.DownloadGate = {
    async unlockAndDownload(blob, filename) {
      if (!DEV_DOWNLOAD_MODE) throw new Error('Rewarded ad provider is not configured.');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = filename; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  $('#studio-upload-button').addEventListener('click', () => fileInput.click());
  $('#studio-preview-fullscreen').addEventListener('click', togglePreviewFullscreen);
  $('#studio-save').addEventListener('click', saveCurrentChanges);
  fileInput.addEventListener('change', () => loadFile(fileInput.files[0]));
  uploadZone.addEventListener('dragover', (event) => { event.preventDefault(); uploadZone.classList.add('is-dragging'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('is-dragging'));
  uploadZone.addEventListener('drop', (event) => { event.preventDefault(); uploadZone.classList.remove('is-dragging'); loadFile(event.dataTransfer.files[0]); });
  document.querySelectorAll('.studio-tool-tab').forEach((tab) => tab.addEventListener('click', () => { enterFullEditor(); document.querySelectorAll('.studio-tool-tab').forEach((item) => item.classList.remove('is-active')); tab.classList.add('is-active'); state.tool = tab.dataset.tool; $('#studio-canvas-wrap').hidden = false; compareWrap.hidden = true; updatePreview(); renderToolPanel(); }));
  $('#studio-compare-range').addEventListener('input', (event) => { $('#studio-after-layer').style.width = `${event.currentTarget.value}%`; });
  $('#studio-download').addEventListener('click', async () => {
    if (!state.originalFile) return;
    try {
      const type = $('#studio-format').value;
      const quality = Number($('#studio-quality').value);
      const blob = state.currentBlob instanceof Blob && type === state.currentBlob.type ? state.currentBlob : await blobFromPreview(type, quality);
      saveHistory(blob, 'Edited image');
      await DownloadGate.unlockAndDownload(blob, `isokohub-image.${type.split('/')[1] === 'jpeg' ? 'jpg' : type.split('/')[1]}`);
    } catch (error) { setError('😕 Something went wrong. Try Again or choose another image.'); }
  });

  renderToolPanel();
})();
