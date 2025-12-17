const promptGrid = document.getElementById('prompt-grid');
const promptTextarea = document.getElementById('prompt');
const apiKeyInput = document.getElementById('api-key');
const quotaStatus = document.getElementById('quota-status');
const quotaPill = document.getElementById('quota-pill');
const quotaRaw = document.getElementById('quota-raw');
const quotaConverted = document.getElementById('quota-converted');
const perImageUsage = document.getElementById('per-image-usage');
const toggleVisibility = document.getElementById('toggle-visibility');
const clearKeyButton = document.getElementById('clear-key');
const saveKeyButton = document.getElementById('save-key');
const checkQuotaButton = document.getElementById('check-quota');
const generationStatus = document.getElementById('generation-status');
const generationStatusPill = document.getElementById('generation-status-pill');
const resultGrid = document.getElementById('result-grid');
const resultCount = document.getElementById('result-count');
const modeSelect = document.getElementById('mode');
const baseImageInput = document.getElementById('base-image');
const refImagesInput = document.getElementById('ref-images');
const baseThumb = document.getElementById('base-thumb');
const multiThumbs = document.getElementById('multi-thumbs');
const img2imgWrap = document.getElementById('img2img-wrap');
const multiWrap = document.getElementById('multi-wrap');

const BILLING_URL = 'https://aihubmix.com/dashboard/billing/remain';
const IMAGE_URL_BASE = 'https://aihubmix.com/gemini/v1beta/models';

const promptTemplates = [
  {
    title: '极简科技感 PPT 封面',
    tag: 'PPT',
    body:
      '玻璃拟态渐变，留出标题区域，深空蓝加少量点光，干净克制。'
  },
  {
    title: '电商极简主图',
    tag: '电商',
    body: '4K 产品主图，柔和顶光，轻薄渐变背景，无水印，高对比度。'
  },
  {
    title: '治愈系插画海报',
    tag: '插画',
    body: '手绘笔触，柔焦背景，角色温暖，细节丰富但保留留白。'
  },
  {
    title: '会议纪要封面',
    tag: 'PPT',
    body: '深色底，蓝绿流线，右上角点阵，稳重克制，标题区域充足。'
  }
];

function renderPromptLibrary() {
  promptGrid.innerHTML = '';
  promptTemplates.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.innerHTML = `
      <span class="copy-chip">复制</span>
      <div class="tag">${item.tag}</div>
      <h3>${item.title}</h3>
      <p>${item.body}</p>
      <div class="caption">点击填入</div>
    `;
    card.addEventListener('click', () => {
      promptTextarea.value = `${item.title}\n${item.body}`;
      navigator.clipboard?.writeText(`${item.title}\n${item.body}`);
      flash(card);
    });
    card.style.transitionDelay = `${index * 30}ms`;
    promptGrid.appendChild(card);
  });
}

function flash(node) {
  node.animate(
    [
      { transform: 'translateY(-2px)', borderColor: 'rgba(111,181,154,0.5)' },
      { transform: 'translateY(0)', borderColor: 'var(--border)' }
    ],
    { duration: 400 }
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result.split(',')[1]);
      } else {
        reject(new Error('文件读取失败'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

function renderThumbsFromFiles(files, container) {
  if (!container) return;
  container.innerHTML = '';
  [...files].forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const wrapper = document.createElement('div');
      wrapper.className = 'thumb';
      const img = document.createElement('img');
      img.src = reader.result;
      wrapper.appendChild(img);
      container.appendChild(wrapper);
    };
    reader.readAsDataURL(file);
  });
}

function updateModeVisibility() {
  const mode = modeSelect?.value || 'text';
  if (img2imgWrap) {
    img2imgWrap.style.display = mode === 'img2img' ? 'flex' : 'none';
  }
  if (multiWrap) {
    multiWrap.style.display = mode === 'multi' ? 'flex' : 'none';
  }
}

function setStatus(el, text, tone = 'muted') {
  el.textContent = text;
  el.className = `status ${tone}`;
}

function setPill(pillEl, text, tone) {
  pillEl.textContent = text;
  pillEl.className = `pill ${tone ?? ''}`.trim();
}

function loadStoredKey() {
  const stored = localStorage.getItem('aihubmix-key');
  if (stored) {
    apiKeyInput.value = stored;
  }
}

async function fetchQuota() {
  const key = apiKeyInput.value.trim();
  if (!key) {
    setStatus(quotaStatus, '缺少 Key');
    return;
  }
  setStatus(quotaStatus, '查询中...');
  setPill(quotaPill, '查询中', 'info');
  try {
    const resp = await fetch(BILLING_URL, {
      headers: {
        authorization: `Bearer ${key}`
      }
    });
    if (!resp.ok) {
      throw new Error(`查询失败：${resp.status}`);
    }
    const data = await resp.json();
    const rawRemain = Number(data?.total_usage ?? data?.remain ?? data?.credit);
    const hasNumber = Number.isFinite(rawRemain);
    const converted = hasNumber ? rawRemain * 9 : null;
    const remainText = hasNumber ? `${converted}` : '未知';
    setStatus(quotaStatus, `剩余 ${remainText}`);
    setPill(quotaPill, `剩余 ${remainText}`, 'success');
    if (quotaRaw) {
      quotaRaw.textContent = hasNumber
        ? `接口 total_usage：${rawRemain}`
        : '接口未返回 total_usage 数字';
    }
    if (quotaConverted) {
      quotaConverted.textContent = hasNumber
        ? `折算后剩余额度：${converted}`
        : '暂无法换算额度';
    }
  } catch (error) {
    setStatus(quotaStatus, error.message || '查询失败', 'error');
    setPill(quotaPill, '查询失败', '');
    console.error(error);
  }
}

function normalizeImageUrl(payload) {
  if (!payload) return null;
  if (payload.data?.[0]?.url) return payload.data[0].url;
  if (payload.images?.[0]?.url) return payload.images[0].url;
  const base64 = payload.data?.[0]?.b64_json || payload.images?.[0]?.b64_json;
  if (base64) return `data:image/png;base64,${base64}`;
  const candidate = payload.candidates?.[0];
  const inline = candidate?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData?.data;
  if (inline) return `data:image/png;base64,${inline}`;
  return null;
}

async function generateImage(event) {
  event.preventDefault();
  const key = apiKeyInput.value.trim();
  if (!key) {
    alert('请先填写 API Key');
    return;
  }
  const prompt = promptTextarea.value.trim();
  if (!prompt) return;

  const mode = modeSelect?.value || 'text';
  const model = document.getElementById('model').value || 'gemini-3-pro-image-preview';
  const aspectRatio = document.getElementById('aspect-ratio').value;
  const resolution = document.getElementById('resolution').value;

  const parts = [{ text: prompt }];

  const payload = {
    contents: [
      {
        role: 'user',
        parts
      }
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: resolution
      }
    }
  };

  try {
    if (mode === 'img2img') {
      const file = baseImageInput?.files?.[0];
      if (!file) {
        alert('请先上传一张参考图');
        return;
      }
      const base64 = await fileToBase64(file);
      parts.push({ inlineData: { mimeType: file.type || 'image/png', data: base64 } });
    } else if (mode === 'multi') {
      const files = refImagesInput?.files ? Array.from(refImagesInput.files).slice(0, 3) : [];
      if (!files.length) {
        alert('请至少上传一张参考图');
        return;
      }
      const refs = await Promise.all(files.map((file) => fileToBase64(file)));
      refs.forEach((data, index) => {
        const file = files[index];
        parts.push({ inlineData: { mimeType: file.type || 'image/png', data } });
      });
    }
  } catch (error) {
    setStatus(generationStatus, error.message || '读取图片失败', 'error');
    setPill(generationStatusPill, '读取图片失败', '');
    return;
  }

  setStatus(generationStatus, '生成中...');
  setPill(generationStatusPill, '生成中', 'info');

  try {
    const endpoint = `${IMAGE_URL_BASE}/${encodeURIComponent(model)}:generateContent`;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': key
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || `请求失败：${resp.status}`);
    }

    const data = await resp.json();
    const imageUrl = normalizeImageUrl(data);
    if (!imageUrl) {
      throw new Error('未在响应中找到图片 URL 或 base64 数据');
    }
    const usageValue = Number(
      data?.usage?.total_usage ?? data?.usage?.image_usage ?? data?.usage
    );
    if (perImageUsage) {
      if (Number.isFinite(usageValue)) {
        const converted = usageValue * 9;
        perImageUsage.textContent = `本次生成折算消耗：${converted}`;
      } else {
        perImageUsage.textContent = '本次生成未返回 usage 字段，暂无法展示单次消耗。';
      }
    }
      appendResult(imageUrl, prompt);
    setStatus(generationStatus, '完成');
    setPill(generationStatusPill, '完成', 'success');
    fetchQuota();
  } catch (error) {
    console.error(error);
    setStatus(generationStatus, error.message || '请求失败', 'error');
    setPill(generationStatusPill, '生成失败', '');
  }
}

function appendResult(url, title) {
  if (!url) return;
  if (resultGrid.querySelector('.placeholder')) {
    resultGrid.innerHTML = '';
  }
  const card = document.createElement('div');
  card.className = 'result-card';
  card.innerHTML = `
    <img src="${url}" alt="生成图片" />
    <div class="card-body">
      <p class="caption">${title}</p>
      <div class="form__footer">
        <a class="button ghost" href="${url}" download target="_blank" rel="noreferrer">下载</a>
        <button class="button" type="button">复制链接</button>
      </div>
    </div>
  `;
  const copyButton = card.querySelector('button');
  copyButton.addEventListener('click', () => navigator.clipboard?.writeText(url));
  resultGrid.prepend(card);
  const current = Number(resultCount.dataset.count || 0) + 1;
  resultCount.dataset.count = String(current);
  resultCount.textContent = `${current} 张`;
}

function togglePassword() {
  const isHidden = apiKeyInput.type === 'password';
  apiKeyInput.type = isHidden ? 'text' : 'password';
  toggleVisibility.textContent = isHidden ? '隐藏' : '显示';
}

function clearKey() {
  localStorage.removeItem('aihubmix-key');
  apiKeyInput.value = '';
  setPill(quotaPill, '额度', '');
  setStatus(quotaStatus, '已清除');
}

function saveKey() {
  localStorage.setItem('aihubmix-key', apiKeyInput.value.trim());
  fetchQuota();
}

function setupEvents() {
  renderPromptLibrary();
  document.getElementById('generate-form').addEventListener('submit', generateImage);
  toggleVisibility.addEventListener('click', togglePassword);
  clearKeyButton.addEventListener('click', clearKey);
  saveKeyButton.addEventListener('click', saveKey);
  checkQuotaButton.addEventListener('click', fetchQuota);
  modeSelect?.addEventListener('change', updateModeVisibility);
  baseImageInput?.addEventListener('change', (e) => {
    const files = e.target.files ? [e.target.files[0]].filter(Boolean) : [];
    renderThumbsFromFiles(files, baseThumb);
  });
  refImagesInput?.addEventListener('change', (e) => {
    const files = e.target.files ? Array.from(e.target.files).slice(0, 3) : [];
    renderThumbsFromFiles(files, multiThumbs);
  });
}

function init() {
  loadStoredKey();
  setupEvents();
  setPill(generationStatusPill, '等待', 'info');
  updateModeVisibility();
  if (perImageUsage) {
    perImageUsage.textContent = '生成后会展示本次 usage 消耗';
  }
}

document.addEventListener('DOMContentLoaded', init);
