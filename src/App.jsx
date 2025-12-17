import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import './index.css';
import { cn } from './lib/utils';

const BILLING_URL = 'https://aihubmix.com/dashboard/billing/remain';
const GEMINI_URL_BASE = 'https://aihubmix.com/gemini/v1beta/models';
const DOUDAO_PREDICT_URL = 'https://aihubmix.com/v1/models/doubao/doubao-seedream-4-5-251128/predictions';
const REMAIN_MULTIPLIER = 1000;
const NANOBANANA_COST = 2000;

const promptTemplates = [
  {
    title: '极简科技感 PPT 封面',
    tag: 'PPT',
    body: '玻璃拟态渐变，留出标题区域，深空蓝加少量点光，干净克制。'
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

function useStoredState(key, initial) {
  const [value, setValue] = useState(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return saved ?? initial;
  });

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  }, [key, value]);

  return [value, setValue];
}

function StatusText({ tone = 'muted', children }) {
  const toneClass = {
    muted: 'text-slate-400',
    success: 'text-emerald-200',
    error: 'text-red-200'
  }[tone];
  return <p className={cn('text-sm', toneClass)}>{children}</p>;
}

function ThumbList({ files }) {
  if (!files?.length) return null;
  return (
    <div className="thumb-grid flex flex-wrap gap-3">
      {files.map((file) => (
        <img key={file.name} src={file.preview} alt={file.name} className="h-16 w-16 object-cover" />
      ))}
    </div>
  );
}

function ResultCard({ url, prompt }) {
  return (
    <Card className="overflow-hidden">
      <img src={url} alt="生成结果" className="w-full" />
      <CardContent className="flex flex-col gap-3">
        <p className="result-prompt text-sm text-slate-300 leading-relaxed">{prompt}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" className="border border-slate-800 text-slate-100">
            <a href={url} download target="_blank" rel="noreferrer">
              下载
            </a>
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigator.clipboard?.writeText(url)}
          >
            复制链接
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function App() {
  const fileInputRef = useRef(null);
  const multiInputRef = useRef(null);
  const [apiKey, setApiKey] = useStoredState('aihubmix-key', '');
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('text');
  const [model, setModel] = useState('gemini-3-pro-image-preview');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resolution, setResolution] = useState('4K');
  const [quotaBadge, setQuotaBadge] = useState({ text: '未查询', tone: 'muted' });
  const [quotaStatus, setQuotaStatus] = useState('未查询');
  const [perImageUsage, setPerImageUsage] = useState('本次生成会展示 usage，nanobanana 单次约 2000');
  const [generationStatus, setGenerationStatus] = useState({ text: '等待', tone: 'info' });
  const [results, setResults] = useState([]);
  const [baseFile, setBaseFile] = useState([]);
  const [multiFiles, setMultiFiles] = useState([]);
  const [isBusy, setIsBusy] = useState(false);

  const resultCount = useMemo(() => results.length, [results]);

  const handleQuota = async () => {
    const key = apiKey.trim();
    if (!key) {
      setQuotaStatus('缺少 Key');
      return;
    }
    setQuotaStatus('查询中...');
    setQuotaBadge({ text: '查询中', tone: 'info' });
    try {
      const resp = await fetch(BILLING_URL, {
        headers: { authorization: `Bearer ${key}` }
      });
      if (!resp.ok) {
        throw new Error(`查询失败：${resp.status}`);
      }
      const data = await resp.json();
      const rawRemain = Number(data?.total_usage ?? data?.remain ?? data?.credit);
      const hasNumber = Number.isFinite(rawRemain);
      const converted = hasNumber ? rawRemain * REMAIN_MULTIPLIER : null;
      const remainText = hasNumber ? converted.toFixed(3) : '未知';
      setQuotaStatus('额度查询成功');
      setQuotaBadge({ text: `剩余 ${remainText}`, tone: 'success' });
    } catch (error) {
      setQuotaStatus(error.message || '查询失败');
      setQuotaBadge({ text: '查询失败', tone: 'default' });
      console.error(error);
    }
  };

  const handleClear = () => {
    setApiKey('');
    setQuotaStatus('已清除');
    setQuotaBadge({ text: '额度', tone: 'muted' });
  };

  const handlePromptFill = (item) => {
    const text = `${item.title}\n${item.body}`;
    setPrompt(text);
    navigator.clipboard?.writeText(text);
  };

  const fileListToPreview = (files) =>
    Array.from(files).slice(0, 3).map((file) => {
      const preview = URL.createObjectURL(file);
      return Object.assign(file, { preview });
    });

  const normalizeImageUrl = (payload) => {
    if (!payload) return null;
    if (Array.isArray(payload.output)) {
      const first = payload.output[0];
      if (typeof first === 'string') return first;
      if (first?.url) return first.url;
    }
    if (payload.output?.url) return payload.output.url;
    if (payload.data?.[0]?.url) return payload.data[0].url;
    if (payload.images?.[0]?.url) return payload.images[0].url;
    const base64 = payload.data?.[0]?.b64_json || payload.images?.[0]?.b64_json;
    if (base64) return `data:image/png;base64,${base64}`;
    const candidate = payload.candidates?.[0];
    const inline = candidate?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData?.data;
    if (inline) return `data:image/png;base64,${inline}`;
    return null;
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
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

  const onGenerate = async (event) => {
    event.preventDefault();
    const key = apiKey.trim();
    if (!key) {
      alert('请先填写 API Key');
      return;
    }
    if (!prompt.trim()) return;

    setIsBusy(true);
    setGenerationStatus({ text: '生成中，耗时较长，请耐心等待...', tone: 'info' });

    const parts = [{ text: prompt.trim() }];
    const isDoubao = model.startsWith('doubao');
    let img2imgData = null;
    let multiImageData = null;

    try {
      if (mode === 'img2img') {
        const file = baseFile?.[0];
        if (!file) {
          alert('请先上传一张参考图');
          setIsBusy(false);
          return;
        }
        const base64 = await fileToBase64(file);
        img2imgData = { base64, file };
        if (!isDoubao) {
          parts.push({ inlineData: { mimeType: file.type || 'image/png', data: base64 } });
        }
      } else if (mode === 'multi') {
        const files = multiFiles.slice(0, 3);
        if (!files.length) {
          alert('请至少上传一张参考图');
          setIsBusy(false);
          return;
        }
        const refs = await Promise.all(files.map((file) => fileToBase64(file)));
        multiImageData = refs.map((data, index) => ({ base64: data, file: files[index] }));
        if (!isDoubao) {
          refs.forEach((data, index) => {
            const file = files[index];
            parts.push({ inlineData: { mimeType: file.type || 'image/png', data } });
          });
        }
      }
    } catch (error) {
      setGenerationStatus({ text: error.message || '读取图片失败', tone: 'error' });
      setIsBusy(false);
      return;
    }

    const buildDoubaoImageField = () => {
      if (mode === 'img2img' && img2imgData) {
        const mime = img2imgData.file?.type || 'image/png';
        return `data:${mime};base64,${img2imgData.base64}`;
      }
      if (mode === 'multi' && multiImageData?.length) {
        return multiImageData.map((item) => {
          const mime = item.file?.type || 'image/png';
          return `data:${mime};base64,${item.base64}`;
        });
      }
      return undefined;
    };

    try {
      const isGemini = !isDoubao;

      const payload = isGemini
        ? {
            contents: [
              {
                role: 'user',
                parts
              }
            ],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
              imageConfig: {
                aspectRatio,
                imageSize: resolution
              }
            }
          }
        : {
            input: {
              model: 'doubao-seedream-4-5-251128',
              prompt: prompt.trim(),
              size: resolution,
              sequential_image_generation: mode === 'multi' ? 'auto' : 'disabled',
              sequential_image_generation_options: mode === 'multi' ? { max_images: multiImageData?.length || 4 } : undefined,
              image: buildDoubaoImageField(),
              response_format: 'url',
              stream: false,
              watermark: true
            }
          };

      const endpoint = isGemini
        ? `${GEMINI_URL_BASE}/${encodeURIComponent(model)}:generateContent`
        : DOUDAO_PREDICT_URL;

      const headers = isGemini
        ? {
            'content-type': 'application/json',
            'x-goog-api-key': key
          }
        : {
            'content-type': 'application/json',
            Authorization: `Bearer ${key}`
          };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
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
      const usageValue = Number(data?.usage?.total_usage ?? data?.usage?.image_usage ?? data?.usage);
      if (Number.isFinite(usageValue)) {
        const converted = (usageValue * REMAIN_MULTIPLIER).toFixed(3);
        setPerImageUsage(`本次生成折算消耗：${converted}（nanobanana 单次约 ${NANOBANANA_COST}）`);
      } else {
        setPerImageUsage(`本次生成未返回 usage 字段，nanobanana 单次约 ${NANOBANANA_COST}`);
      }
      setResults((prev) => [{ url: imageUrl, prompt }, ...prev]);
      setGenerationStatus({ text: '完成', tone: 'success' });
      handleQuota();
    } catch (error) {
      console.error(error);
      setGenerationStatus({ text: error.message || '请求失败', tone: 'error' });
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    if (!apiKey) {
      setQuotaBadge({ text: '额度', tone: 'muted' });
    }
  }, [apiKey]);

  return (
    <div className="w-full px-4 py-6 space-y-6 sm:px-6 lg:space-y-8 lg:px-10 xl:px-14 2xl:px-20">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Nanobanana</p>
          <h1 className="text-3xl font-semibold text-slate-50">AI 图片生成</h1>
          <p className="text-slate-400 text-sm">浏览器直接调用 AIHubMix / Gemini API</p>
          <p className="text-xs text-slate-500">额度显示为千倍且保留三位小数，nanobanana 单次生成约消耗 2000</p>
        </div>
        <Badge variant={generationStatus.tone === 'success' ? 'success' : 'info'} className="self-start">
          {generationStatus.text}
        </Badge>
      </header>

      <div className="card-grid">
        <Card>
          <CardHeader className="border-b border-slate-800/60">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">生成</h2>
              <p className="text-sm text-slate-400">填写提示词，上传参考图，直接获取结果</p>
            </div>
            <Badge variant={generationStatus.tone === 'success' ? 'success' : generationStatus.tone === 'error' ? 'destructive' : 'info'}>
              {generationStatus.text}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-[2fr_1fr] xl:grid-cols-[2.2fr_1fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="flex flex-wrap gap-2">
                      <Input
                        id="api-key"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="flex-1 min-w-[220px]"
                      />
                      <Button type="button" variant="ghost" onClick={handleQuota}>
                        查询额度
                      </Button>
                      <Button type="button" variant="ghost" onClick={handleClear}>
                        清除
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={quotaBadge.tone === 'success' ? 'success' : quotaBadge.tone === 'info' ? 'info' : 'muted'}>
                        {quotaBadge.text}
                      </Badge>
                      <StatusText tone={quotaBadge.tone === 'success' ? 'success' : quotaBadge.tone === 'default' ? 'error' : 'muted'}>
                        {quotaStatus}
                      </StatusText>
                    </div>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={onGenerate}>
                  <div className="space-y-2">
                    <Label htmlFor="prompt">提示词</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="描述画面..."
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="mode">模式</Label>
                      <Select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
                        <option value="text">文生图</option>
                        <option value="img2img">图生图</option>
                        <option value="multi">多图</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">模型</Label>
                      <Select id="model" value={model} onChange={(e) => setModel(e.target.value)}>
                        <option value="gemini-3-pro-image-preview">nanobanana pro</option>
                        <option value="doubao-seedream-4-5">doubao-seedream-4-5</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aspect">画幅比例</Label>
                      <Select id="aspect" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                        {['1:1', '3:4', '4:3', '9:16', '16:9', '21:9', '2:3', '3:2', '4:5', '5:4'].map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="resolution">分辨率</Label>
                      <Select id="resolution" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                        <option value="1K">1K</option>
                        <option value="2K">2K</option>
                        <option value="4K">4K</option>
                      </Select>
                    </div>

                    {mode === 'img2img' && (
                      <div className="space-y-2">
                        <Label htmlFor="base-image">参考图</Label>
                        <Input
                          id="base-image"
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={(e) => setBaseFile(fileListToPreview(e.target.files || []))}
                        />
                        <ThumbList files={baseFile} />
                      </div>
                    )}

                    {mode === 'multi' && (
                      <div className="space-y-2">
                        <Label htmlFor="multi-image">多图参考 (最多 3 张)</Label>
                        <Input
                          id="multi-image"
                          type="file"
                          accept="image/*"
                          multiple
                          ref={multiInputRef}
                          onChange={(e) => setMultiFiles(fileListToPreview(e.target.files || []))}
                        />
                        <ThumbList files={multiFiles} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={isBusy}>
                      {isBusy ? '生成中...' : '生成'}
                    </Button>
                    <StatusText tone={generationStatus.tone === 'error' ? 'error' : generationStatus.tone === 'success' ? 'success' : 'muted'}>
                      {generationStatus.text}
                    </StatusText>
                    <StatusText tone="muted">{perImageUsage}</StatusText>
                  </div>
                </form>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">图片</h3>
                    <Badge variant={resultCount ? 'info' : 'muted'}>{resultCount ? `${resultCount} 张` : '暂无'}</Badge>
                  </div>
                  {results.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/50 p-6 text-slate-400">
                      生成后展示。
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {results.map((item) => (
                        <ResultCard key={item.url} url={item.url} prompt={item.prompt} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Card className="h-full">
                  <CardHeader className="border-b border-slate-800/60">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">模板</p>
                      <h3 className="text-lg font-semibold">快捷提示</h3>
                    </div>
                    <Badge variant="muted">点击填充</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    {promptTemplates.map((item) => (
                      <div
                        key={item.title}
                        className="prompt-card rounded-2xl border border-slate-800/70 bg-slate-900/50 p-4 shadow-sm cursor-pointer"
                        onClick={() => handlePromptFill(item)}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-medium text-indigo-200 bg-indigo-500/15 px-2 py-1 rounded-full">{item.tag}</span>
                          <span className="text-[12px] text-slate-400">点击填入</span>
                        </div>
                        <h4 className="text-base font-semibold text-slate-50">{item.title}</h4>
                        <p className="text-sm text-slate-400 leading-relaxed mt-1">{item.body}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-slate-400 text-sm">
                  <p className="font-semibold text-slate-200">联系</p>
                  <p>微信：tcck1</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
