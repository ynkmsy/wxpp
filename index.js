// WX Message Push - 微信模板消息推送服务
// 统一使用 WX_LANDING_PAGE_URL

async function getParams(request) {
  const { searchParams } = new URL(request.url);
  const urlParams = Object.fromEntries(searchParams.entries());
  let bodyParams = {};
  
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const ct = (request.headers.get('content-type') || '').toLowerCase();
    try {
      if (ct.includes('application/json')) {
        const j = await request.json();
        bodyParams = j.params || j.data || j;
      } else if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
        bodyParams = Object.fromEntries((await request.formData()).entries());
      } else if (ct.includes('text/')) {
        const t = await request.text();
        try { 
          bodyParams = JSON.parse(t); 
        } catch { 
          bodyParams = { content: t }; 
        }
      }
    } catch (e) {
      console.error('参数解析错误:', e.message);
    }
  }
  return { ...urlParams, ...bodyParams };
}

const GITHUB_URL = "https://github.com/ynkmsy/wxpp";

// 内置落地页HTML
const BUILTIN_LANDING_PAGE_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>{{TITLE}}</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

<style>
/* --------------------------
   Apple Dark Frosted UI
   -------------------------- */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

html, body {
  width: 100%;
  height: 100%;
  background: #000;
  color: #fff;
  overflow-x: hidden;
}

/* 背景 Apple 风格光斑 */
.background-blur {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.09), transparent 60%),
              radial-gradient(circle at 80% 70%, rgba(255,255,255,0.06), transparent 60%);
  filter: blur(60px);
}

/* 内容容器 */
.container {
  max-width: 700px;
  margin: 20px auto 40px;
  padding: 22px;
}

/* 大卡片：苹果磨砂玻璃 */
.card {
  background: rgba(255,255,255,0.08);
  backdrop-filter: saturate(180%) blur(22px);
  -webkit-backdrop-filter: saturate(180%) blur(22px);
  border-radius: 26px;
  border: 1px solid rgba(255,255,255,0.09);
  padding: 22px 20px;
  margin-bottom: 20px;

  box-shadow: 
      0 0 40px rgba(255,255,255,0.03),
      inset 0 0 1px rgba(255,255,255,0.25);
}

/* 标题（iOS 通知风） */
.title {
  text-align: center;
  font-size: 1.65rem;
  font-weight: 700;
  margin-bottom: 20px;
  letter-spacing: 0.5px;
  color: #fff;

  /* 苹果风炫酷光效 */
  position: relative;
  text-shadow:
      0 0 6px rgba(255,255,255,0.55),
      0 0 14px rgba(255,255,255,0.35),
      0 0 28px rgba(120,160,255,0.30),       /* 蓝紫柔光 */
      0 0 48px rgba(120,200,255,0.18);      /* 远距离淡光 */
}

.title::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -10px;
  transform: translateX(-50%);

  width: 40%;
  height: 2px;
  border-radius: 50px;
  background: linear-gradient(90deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.45) 50%,
      rgba(255,255,255,0) 100%
  );

  filter: blur(2px) brightness(1.6);
  opacity: 0.8;
}

/* 信息区域 */
.label {
  font-size: 0.9rem;
  opacity: 0.7;
  margin-bottom: 6px;
}

.content {
  font-size: 1.05rem;
  line-height: 1.75;
  white-space: pre-line;
  overflow-wrap: break-word;
}

/* Markdown 样式优化 */
.content img {
  max-width: 100%;
  border-radius: 14px;
  margin: 8px 0;
}

.content pre {
  background: rgba(255,255,255,0.08);
  padding: 12px;
  border-radius: 14px;
  overflow-x: auto;
}

.content code {
  background: rgba(255,255,255,0.10);
  padding: 3px 6px;
  border-radius: 6px;
}

/* 底部信息 */
.footer {
  text-align: center;
  opacity: 0.5;
  font-size: 13px;
  margin-top: 28px;
}
.footer a {
  color: #fff;
  text-decoration: none;
  border-bottom: 1px solid rgba(255,255,255,0.3);
}
.footer a:hover {
  opacity: 0.6;
}

/* 手机端优化 */
@media(max-width: 480px) {
  .container { padding: 14px; }
  .card { padding: 18px 16px; border-radius: 22px; }
  .title { font-size: 1.35rem; }
  .content { font-size: 1.0rem; }
}
</style>
</head>

<body>
<div class="background-blur"></div>

<div class="container">
  <div class="card">
    <h1 class="title">{{TITLE}}</h1>
  </div>

  <div class="card">
    <div class="label">通知内容</div>
    <div class="content" id="msg">{{MESSAGE}}</div>
  </div>

  <div class="card">
    <div class="label">时间</div>
    <div class="content">{{DATE}}</div>
  </div>

  <div class="footer">
    Powered by <a href="${GITHUB_URL}" target="_blank">WX Message Push</a>
  </div>
</div>

<script>
try {
  const msg = document.getElementById('msg');
  msg.innerHTML = marked.parse(msg.innerText);
} catch (e) {
  console.error("Markdown 解析失败:", e);
}
</script>

</body>
</html>`;

// 全局缓存 access_token
const tokenCache = {
  data: null,
  expiry: 0,
  appid: '',
  secret: ''
};

// 验证输入
function validateInput(title, content) {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: '标题不能为空且必须是字符串' };
  }
  if (!content || typeof content !== 'string') {
    return { valid: false, error: '内容不能为空且必须是字符串' };
  }
  
  // 限制长度
  if (title.length > 100) {
    return { valid: false, error: '标题长度不能超过100字符' };
  }
  if (content.length > 5000) {
    return { valid: false, error: '内容长度不能超过5000字符' };
  }
  
  return { valid: true };
}

// 清理HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 获取微信 access_token（带缓存）
async function getStableToken(appid, secret, env) {
  const now = Date.now();
  
  // 检查缓存是否有效（提前5分钟过期）
  if (tokenCache.data && 
      tokenCache.appid === appid && 
      tokenCache.secret === secret && 
      now < tokenCache.expiry - 5 * 60 * 1000) {
    return tokenCache.data;
  }
  
  try {
    const r = await fetch('https://api.weixin.qq.com/cgi-bin/stable_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'client_credential', appid, secret })
    });
    
    if (!r.ok) {
      throw new Error(`微信API请求失败: ${r.status}`);
    }
    
    const d = await r.json();
    
    if (d.access_token) {
      // 缓存 access_token，默认2小时（微信有效期）
      tokenCache.data = d.access_token;
      tokenCache.expiry = now + 2 * 60 * 60 * 1000;
      tokenCache.appid = appid;
      tokenCache.secret = secret;
      
      return d.access_token;
    } else {
      throw new Error(`获取access_token失败: ${d.errmsg || JSON.stringify(d)}`);
    }
  } catch (error) {
    console.error('获取微信token失败:', error);
    throw error;
  }
}

// 获取落地页URL
function getLandingPageUrl(env) {
  // 使用 WX_LANDING_PAGE_URL 环境变量
  if (env.WX_LANDING_PAGE_URL) {
    return env.WX_LANDING_PAGE_URL.replace(/\/+$/, '');
  }
  
  return null; // 表示使用内置落地页
}

// 构建完整的落地页URL
function buildLandingUrl(request, env, title, content, date) {
  const landingPageUrl = getLandingPageUrl(env);
  
  // 使用自定义落地页
  if (landingPageUrl) {
    const params = new URLSearchParams({
      title: encodeURIComponent(title),
      message: encodeURIComponent(content),
      date: encodeURIComponent(date)
    });
    
    // 检查URL是否已经包含查询参数
    const separator = landingPageUrl.includes('?') ? '&' : '?';
    return `${landingPageUrl}${separator}${params.toString()}`;
  }
  
  // 使用内置落地页
  const url = new URL(request.url);
  const host = request.headers.get('host');
  const protocol = url.protocol || 'https:';
  const baseUrl = `${protocol}//${host}`;
  
  return `${baseUrl}/view?title=${encodeURIComponent(title)}&message=${encodeURIComponent(content)}&date=${encodeURIComponent(date)}`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 1. 主页
    if (path === '/' || path === '/index.html') {
      const landingPageUrl = getLandingPageUrl(env);
      const currentHost = request.headers.get('host');
      
      return new Response(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>WX Message Push</title>
<style>
  body{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;font-family:system-ui;max-width:1000px;margin:0 auto;padding:20px;line-height:1.6;}
  .header{text-align:center;margin:40px 0;}
  h1{font-size:42px;background:linear-gradient(90deg,#00bfa5,#0097a7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;}
  .subtitle{opacity:0.8;margin:10px 0 30px;font-size:18px;}
  .card{background:rgba(255,255,255,0.08);border-radius:16px;padding:30px;margin:30px 0;border:1px solid rgba(255,255,255,0.1);}
  h2{color:#00bfa5;margin-top:0;border-bottom:2px solid rgba(0,191,165,0.3);padding-bottom:10px;}
  .config-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:20px;margin:20px 0;}
  .config-item{padding:15px;background:rgba(0,0,0,0.2);border-radius:10px;}
  code{background:rgba(0,0,0,0.4);padding:4px 8px;border-radius:4px;font-family:'Monaco','Consolas',monospace;}
  .code-block{background:rgba(0,0,0,0.4);padding:20px;border-radius:10px;overflow-x:auto;margin:15px 0;}
  .note{background:rgba(255,193,7,0.1);border-left:4px solid #ffc107;padding:15px;margin:20px 0;border-radius:0 8px 8px 0;}
  .warning{background:rgba(244,67,54,0.1);border-left:4px solid #f44336;padding:15px;margin:20px 0;border-radius:0 8px 8px 0;}
  .success{background:rgba(76,175,80,0.1);border-left:4px solid #4caf50;padding:15px;margin:20px 0;border-radius:0 8px 8px 0;}
  .btn{display:inline-block;background:#00bfa5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;transition:all 0.3s;margin:10px 5px;}
  .btn:hover{background:#0097a7;transform:translateY(-2px);box-shadow:0 5px 15px rgba(0,191,165,0.3);}
  .btn-secondary{background:rgba(255,255,255,0.1);}
  .btn-secondary:hover{background:rgba(255,255,255,0.2);}
  .deploy-options{display:flex;gap:15px;flex-wrap:wrap;margin:20px 0;}
  .current-config{margin:15px 0;padding:12px;background:rgba(0,150,136,0.1);border-radius:8px;}
</style></head>
<body>
<div class="header">
  <h1>WX Message Push</h1>
  <div class="subtitle">微信模板消息推送服务</div>
</div>

<div class="current-config">
  <strong>当前配置状态：</strong><br>
  • 落地页配置: ${landingPageUrl 
    ? `<span style="color:#4caf50;">✓ 自定义 (${landingPageUrl})</span>` 
    : `<span style="color:#2196f3;">⚡ 内置 (https://${currentHost}/view)</span>`}<br>
  • 环境变量: ${env.WX_LANDING_PAGE_URL 
    ? '<span style="color:#4caf50;">✓ 使用WX_LANDING_PAGE_URL</span>' 
    : '<span style="color:#2196f3;">⚡ 未设置 (使用内置落地页)</span>'}
</div>

<div class="card">
  <h2>🎯 快速开始</h2>
  <p>访问测试控制台: <code>https://${currentHost}/<strong>你的API_TOKEN</strong></code></p>
${env.API_TOKEN ? `
  <p>
    <button class="btn" onclick="enterConsole()">进入控制台</button>
    <a href="${GITHUB_URL}" class="btn btn-secondary" target="_blank">📖 查看源码</a>
  </p>
  <script>
    function enterConsole() {
      const token = prompt("请输入 API Token 以进入控制台：");
      if (!token) return alert("Token 不能为空！");
      if (token !== "${env.API_TOKEN}") return alert("Token 错误！");
      location.href = "/" + token;
    }
  </script>
` : ''}</div>

<div class="card">
  <h2>⚙️ 环境变量配置</h2>
  <div class="config-grid">
    <div class="config-item">
      <strong>必需配置：</strong><br>
      <code>API_TOKEN</code> - 接口认证令牌<br>
      <code>WX_APPID</code> - 微信应用ID<br>
      <code>WX_SECRET</code> - 微信应用密钥<br>
      <code>WX_OPENID</code> - 用户OpenID(多个用|分隔)<br>
      <code>WX_TEMPLATE_ID</code> - 微信模板ID
    </div>
    <div class="config-item">
      <strong>落地页配置：</strong><br>
      <code>WX_LANDING_PAGE_URL</code> - 独立部署的落地页URL<br>
      <strong>或</strong><br>
      不设置 - 使用内置落地页
    </div>
  </div>
</div>

<div class="card">
  <h2>🚀 落地页部署方案</h2>
  
  <div class="deploy-options">
    <a href="/download/landing-page" class="btn" target="_blank">📥 下载独立落地页</a>
    <a href="/view?title=测试标题&message=这是一个**测试消息**&date=2024-01-01" class="btn btn-secondary" target="_blank">👁️ 预览内置落地页</a>
  </div>
  
  <h3>方案一：内置落地页（最简单）</h3>
  <p>不设置 <code>WX_LANDING_PAGE_URL</code> 环境变量，系统自动使用内置落地页。</p>
  
  <h3>方案二：独立部署落地页（推荐）</h3>
  <ol>
    <li>点击上方"下载独立落地页"获取HTML文件</li>
    <li>部署到静态托管服务（GitHub Pages、Vercel等）</li>
    <li>设置环境变量: <code>WX_LANDING_PAGE_URL=https://your-domain.com/landing.html</code></li>
  </ol>
  
  <div class="success">
    <strong>独立部署的优势：</strong><br>
    • 不依赖Worker域名<br>
    • 可以部署到CDN，加载更快<br>
    • 可以自定义样式和功能
  </div>
</div>

<div class="card">
  <h2>🔗 API接口</h2>
  
  <h3>Webhook接口</h3>
  <div class="code-block">
<pre>POST /webhook
Content-Type: application/json
Authorization: Bearer 你的API_TOKEN

{
  "title": "消息标题",
  "content": "消息内容",
  "userid": "可选，覆盖默认用户"
}</pre>
  </div>
  
  <h3>内置路由</h3>
  <ul>
    <li><code>/</code> - 本页面（部署指南）</li>
    <li><code>/{API_TOKEN}</code> - 测试控制台</li>
    <li><code>/webhook</code> - 推送接口</li>
    <li><code>/view</code> - 内置落地页</li>
    <li><code>/download/landing-page</code> - 下载独立落地页</li>
  </ul>
</div>

</body></html>`, {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
      });
    }

    // 2. 下载独立落地页
    if (path === '/download/landing-page') {
      const standaloneHtml = `<!DOCTYPE html>
<!-- 
微信消息推送 - 独立落地页
部署说明：
1. 将此文件上传到任何静态托管服务
2. 设置 WX_LANDING_PAGE_URL 环境变量指向此文件URL
3. 确保URL格式为：https://your-domain.com/landing.html?title=xxx&message=xxx&date=xxx
-->
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0,user-scalable=yes">
    <title>微信消息详情</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        * {margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI','Microsoft YaHei',sans-serif;-webkit-tap-highlight-color:transparent;}
        html, body {height:100%;overflow:auto;background:linear-gradient(135deg,#0f0c29,#1a1a3e);color:#e0f7fa;position:relative;}
        body {min-height:100vh;padding:16px;display:flex;justify-content:center;align-items:flex-start;position:relative;overflow-y:auto;-webkit-overflow-scrolling:touch;}
        body::before {content:'';position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(circle at 15% 35%,rgba(0,150,136,0.18),transparent 50%),radial-gradient(circle at 85% 70%,rgba(0,188,212,0.15),transparent 50%);z-index:-1;}
        .container {max-width:760px;width:100%;background:rgba(18,18,40,0.95);backdrop-filter:blur(16px);border-radius:18px;padding:36px 28px;margin:20px auto;box-shadow:0 16px 48px rgba(0,0,0,0.7),0 0 0 1px rgba(0,150,136,0.3),0 0 32px rgba(0,188,212,0.35);position:relative;overflow:visible;min-height:auto;}
        .container::before {content:'';position:absolute;top:0;left:0;width:100%;height:5px;background:linear-gradient(90deg,#00bfa5,#00acc1);}
        .title {font-size:1.68rem;text-align:center;margin-bottom:34px;color:#00bfa5;letter-spacing:1.8px;line-height:1.4;position:relative;word-break:break-word;}
        .title::after {content:'';position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);width:90px;height:2.5px;background:linear-gradient(90deg,transparent,#00bfa5,transparent);}
        .info-card {background:rgba(25,30,65,0.88);border-left:4px solid #00bfa5;border-radius:12px;padding:22px;margin:22px 0;box-shadow:0 6px 18px rgba(0,0,0,0.4);overflow-wrap:break-word;word-break:break-word;}
        .info-label {font-size:1.08rem;color:#80deea;margin-bottom:11px;display:flex;align-items:center;font-weight:600;}
        .info-label::before {content:'';width:8px;height:8px;background:#00bfa5;border-radius:50%;margin-right:11px;flex-shrink:0;}
        .info-content {font-size:1.06rem;color:#e0f7fa;line-height:1.8;white-space:pre-line;overflow-wrap:break-word;word-break:break-word;}
        .info-content img {max-width:100%;height:auto;border-radius:8px;margin:8px 0;}
        .info-content pre {background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;overflow-x:auto;}
        .info-content code {background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;}
        .info-content a {color:#00bfa5;text-decoration:none;border-bottom:1px solid #00bfa5;}
        .info-content a:hover {color:#80deea;border-color:#80deea;}
        .footer {text-align:center;margin-top:46px;opacity:0.78;font-size:13.5px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);}
    </style>
</head>
<body>
<div class="container">
    <h1 class="title" id="pageTitle">消息详情</h1>
    <div class="info-card">
        <div class="info-label">通知内容</div>
        <div class="info-content" id="messageContent">正在加载消息内容...</div>
    </div>
    <div class="info-card">
        <div class="info-label">时间</div>
        <div class="info-content" id="messageDate">-</div>
    </div>
    <div class="footer">
        Powered by <strong>WX Push</strong>
    </div>
</div>
<script>
// 解析URL参数
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        title: params.get('title') || '微信消息通知',
        message: params.get('message') || '暂无消息内容',
        date: params.get('date') || new Date().toLocaleString('zh-CN')
    };
}

// 更新页面内容
function updatePageContent() {
    const params = getUrlParams();
    
    // URL解码
    const title = decodeURIComponent(params.title);
    const message = decodeURIComponent(params.message);
    const date = decodeURIComponent(params.date);
    
    // 设置页面内容
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('messageDate').textContent = date;
    
    // 使用marked解析Markdown
    try {
        document.getElementById('messageContent').innerHTML = marked.parse(message);
    } catch (e) {
        document.getElementById('messageContent').textContent = message;
    }
    
    // 更新页面标题
    document.title = title;
}

// 页面加载时执行
window.addEventListener('DOMContentLoaded', updatePageContent);
</script>
</body>
</html>`;
      
      return new Response(standaloneHtml, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Content-Disposition': 'attachment; filename="wx-landing-page.html"',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // 3. 内置落地页
    if (request.method === 'GET' && path === '/view') {
      const title = url.searchParams.get('title') || '微信消息通知';
      const message = url.searchParams.get('message') || '暂无消息内容';
      const date = url.searchParams.get('date') || new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
      
      // 转义用户输入
      const safeTitle = escapeHtml(title);
      const safeMessage = escapeHtml(message);
      const safeDate = escapeHtml(date);
      
      const html = BUILTIN_LANDING_PAGE_HTML
        .replace(/{{TITLE}}/g, safeTitle)
        .replace(/{{MESSAGE}}/g, safeMessage)
        .replace(/{{DATE}}/g, safeDate);
      
      return new Response(html, { 
        headers: { 
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-cache, max-age=0'
        } 
      });
    }

    // 4. Webhook 推送接口
    if (path === '/webhook' || path.startsWith('/webhook/')) {
      try {
        const p = await getParams(request);
        const { title, content, token, userid, appid, secret, template_id } = p;
        
        // 认证
        const authToken = token || request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
        if (!authToken || authToken !== env.API_TOKEN) {
          return new Response('无效的认证令牌', { status: 403 });
        }
        
        // 验证输入
        const validation = validateInput(title, content);
        if (!validation.valid) {
          return new Response(validation.error, { status: 400 });
        }
        
        // 获取配置
        const finalAppId = appid || env.WX_APPID;
        const finalSecret = secret || env.WX_SECRET;
        const userList = (userid || env.WX_OPENID || '').split('|').map(s => s.trim()).filter(Boolean);
        const tmplId = template_id || env.WX_TEMPLATE_ID;
        const landingPageUrl = getLandingPageUrl(env);
        
        // 检查配置
        const missingConfigs = [];
        if (!finalAppId) missingConfigs.push('WX_APPID');
        if (!finalSecret) missingConfigs.push('WX_SECRET');
        if (userList.length === 0) missingConfigs.push('WX_OPENID');
        if (!tmplId) missingConfigs.push('WX_TEMPLATE_ID');
        
        if (missingConfigs.length > 0) {
          return new Response(`缺少配置: ${missingConfigs.join(', ')}`, { status: 500 });
        }
        
        // 获取 access_token
        const accessToken = await getStableToken(finalAppId, finalSecret, env);
        
        // 准备数据
        const now = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
        const jumpUrl = buildLandingUrl(request, env, title, content, now);
        
        console.log('发送消息配置:', {
          appId: finalAppId,
          userCount: userList.length,
          landingUrl: jumpUrl,
          landingType: landingPageUrl ? '独立部署' : '内置落地页',
          envVarUsed: env.WX_LANDING_PAGE_URL ? 'WX_LANDING_PAGE_URL' : '无 (内置)'
        });
        
        // 发送消息
        const results = await Promise.all(userList.map(async (uid, index) => {
          try {
            const response = await fetch(`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                touser: uid,
                template_id: tmplId,
                url: jumpUrl,
                data: {
                  title: { value: title },
                  content: { value: content }
                }
              })
            });
            
            const data = await response.json();
            return { uid, success: data.errmsg === 'ok', data };
          } catch (error) {
            console.error(`发送给用户 ${uid} 失败:`, error);
            return { uid, success: false, error: error.message };
          }
        }));
        
        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;
        
        // 构建响应
        const responseData = {
          success: successCount > 0,
          total: results.length,
          successCount,
          failCount,
          landingPage: {
            url: jumpUrl,
            type: landingPageUrl ? 'independent' : 'builtin',
            source: landingPageUrl || 'builtin',
            envVar: env.WX_LANDING_PAGE_URL ? 'WX_LANDING_PAGE_URL' : 'none'
          },
          config: {
            appid: finalAppId ? `${finalAppId.substring(0, 8)}...` : '未配置',
            userCount: userList.length,
            templateId: tmplId
          },
          results: results.map(r => ({
            success: r.success,
            message: r.success ? '发送成功' : (r.data?.errmsg || r.error || '未知错误')
          }))
        };
        
        return new Response(JSON.stringify(responseData, null, 2), {
          status: successCount > 0 ? 200 : 500,
          headers: { 'Content-Type': 'application/json;charset=UTF-8' }
        });
        
      } catch (error) {
        console.error('Webhook处理错误:', error);
        return new Response(`服务器内部错误: ${error.message}`, { status: 500 });
      }
    }

    // 5. 测试控制台
    const tokenMatch = path.match(/^\/([^\/]+)\/?$/);
    if (tokenMatch) {
      const token = tokenMatch[1];
      
      // 排除列表
      const excludedPaths = ['webhook', 'view', 'download', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'api', 'static'];
      if (excludedPaths.includes(token.toLowerCase())) {
        return new Response('Not Found', { status: 404 });
      }
      
      // 验证token
      if (token !== env.API_TOKEN) {
        return new Response('Forbidden', { status: 403 });
      }
      
      // 安全转义
      const safeToken = escapeHtml(token);
      const currentHost = request.headers.get('host');
      const landingPageUrl = getLandingPageUrl(env);
      
      return new Response(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>WX Message Push 测试控制台</title>
  <style>
    :root{--bg:linear-gradient(135deg,#1a1a2e,#16213e);--card:rgba(255,255,255,0.08);--accent:#00bfa5;}
    body{background:var(--bg);color:#fff;font-family:system-ui;margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;}
    .card{background:var(--card);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:40px;max-width:800px;width:100%;box-shadow:0 20px 40px rgba(0,0,0,0.3);}
    h1{font-size:36px;margin:0 0 8px;background:linear-gradient(90deg,#00bfa5,#0097a7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-align:center;}
    label{display:block;margin:20px 0 8px;font-weight:600;color:#80deea;}
    input,textarea{width:100%;padding:14px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:white;font-size:14px;transition:all 0.3s;}
    input:focus,textarea:focus{outline:none;border-color:#00bfa5;box-shadow:0 0 0 2px rgba(0,191,165,0.2);}
    button{margin-top:24px;padding:14px 32px;background:var(--accent);border:none;border-radius:12px;color:white;font-weight:600;cursor:pointer;transition:all 0.3s;}
    button:hover{background:#0097a7;transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,191,165,0.4);}
    button:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
    #resp{margin-top:24px;padding:20px;background:rgba(0,0,0,0.3);border-radius:12px;display:none;white-space:pre-wrap;font-family:monospace;max-height:400px;overflow-y:auto;border-left:4px solid transparent;}
    .author{text-align:center;margin-top:32px;opacity:0.8;font-size:15px;}
    .config-info{margin-top:20px;padding:20px;background:rgba(0,0,0,0.2);border-radius:12px;font-size:14px;}
    .config-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:15px;margin-top:10px;}
    .config-item{padding:12px;background:rgba(0,0,0,0.1);border-radius:8px;}
    .success{color:#4caf50;}
    .warning{color:#ff9800;}
    .error{color:#f44336;}
    .info{color:#2196f3;}
    .deployment-type{margin-top:20px;padding:15px;border-radius:10px;}
    .independent{background:rgba(76,175,80,0.1);border-left:4px solid #4caf50;}
    .builtin{background:rgba(33,150,243,0.1);border-left:4px solid #2196f3;}
    .counter{font-size:12px;text-align:right;opacity:0.7;margin-top:4px;}
  </style>
</head>
<body>
  <div class="card">
    <h1>WX Message Push</h1>
    <p style="text-align:center;margin-bottom:24px;opacity:0.9;">微信模板消息测试控制台</p>
    
    <div class="config-info">
      <strong>🔧 当前配置状态</strong>
      <div class="config-grid">
        <div class="config-item">
          <div>API Token: <span class="${env.API_TOKEN ? 'success' : 'error'}">${env.API_TOKEN ? '✓ 已配置' : '✗ 未配置'}</span></div>
          <div>WX_APPID: <span class="${env.WX_APPID ? 'success' : 'error'}">${env.WX_APPID ? '✓ 已配置' : '✗ 未配置'}</span></div>
          <div>WX_SECRET: <span class="${env.WX_SECRET ? 'success' : 'error'}">${env.WX_SECRET ? '✓ 已配置' : '✗ 未配置'}</span></div>
        </div>
        <div class="config-item">
          <div>WX_OPENID: <span class="${env.WX_OPENID ? 'success' : 'error'}">${env.WX_OPENID ? `✓ ${env.WX_OPENID.split('|').length}个用户` : '✗ 未配置'}</span></div>
          <div>WX_TEMPLATE_ID: <span class="${env.WX_TEMPLATE_ID ? 'success' : 'error'}">${env.WX_TEMPLATE_ID ? '✓ 已配置' : '✗ 未配置'}</span></div>
        </div>
      </div>
      
      <div class="deployment-type ${landingPageUrl ? 'independent' : 'builtin'}">
        <strong>📄 落地页部署方式：</strong><br>
        ${landingPageUrl 
          ? `✅ 独立部署<br>URL: <code>${landingPageUrl}</code>` 
          : `⚡ 内置部署<br>URL: <code>https://${currentHost}/view</code><br>
             <small>（建议下载独立落地页部署到其他地方）</small>`}
      </div>
    </div>
    
    <form id="f">
      <label>消息标题 (最长100字符)</label>
      <input name="title" value="测试消息标题" required maxlength="100" placeholder="请输入消息标题">
      <div class="counter" id="titleCounter">0/100</div>
      
      <label>消息内容（支持Markdown语法）</label>
      <textarea name="content" rows="6" required maxlength="5000" placeholder="请输入消息内容，支持Markdown格式...">这是一条**测试消息**，支持多种格式：

• 列表项1
• 列表项2
• 列表项3

> 引用内容

\`代码片段\`

[链接示例](https://example.com)</textarea>
      <div class="counter" id="contentCounter">0/5000</div>
      
      <label>用户OpenID（可选，多个用 | 分隔，留空使用默认配置）</label>
      <input name="userid" placeholder="例如: o6_bmjrPTlm6_2sgVt7hMZOPfL2M|o6_bmjrPTlm6_2sgVt7hMZOPfL2N">
      
      <input type="hidden" name="token" value="${safeToken}">
      <button type="submit">🚀 发送测试消息</button>
    </form>
    
    <pre id="resp"></pre>
    
    <div style="margin-top:30px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="author">Made with ❤ by <strong>SY</strong></div>
        <div style="display:flex;gap:10px;">
          <a href="/" style="color:#80deea;text-decoration:none;font-size:14px;">返回主页</a>
          ${landingPageUrl ? '' : '<a href="/download/landing-page" style="color:#80deea;text-decoration:none;font-size:14px;">下载独立落地页</a>'}
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // 字符计数器
    function setupCounter(inputId, counterId, maxLength) {
      const input = document.querySelector(\`[name="\${inputId}"]\`);
      const counter = document.getElementById(counterId);
      
      function updateCounter() {
        const length = input.value.length;
        counter.textContent = \`\${length}/\${maxLength}\`;
        
        if (length > maxLength * 0.9) {
          counter.style.color = '#ff9800';
        } else if (length > maxLength) {
          counter.style.color = '#f44336';
          input.value = input.value.substring(0, maxLength);
          counter.textContent = \`\${maxLength}/\${maxLength}\`;
        } else {
          counter.style.color = '';
        }
      }
      
      input.addEventListener('input', updateCounter);
      updateCounter();
    }
    
    setupCounter('title', 'titleCounter', 100);
    setupCounter('content', 'contentCounter', 5000);
    
    // 表单提交
    document.getElementById('f').onsubmit = async e => {
      e.preventDefault();
      const b = e.target.querySelector('button');
      const r = document.getElementById('resp');
      
      b.disabled = true;
      b.innerHTML = '⏳ 发送中...';
      r.style.display = 'none';
      
      const d = Object.fromEntries(new FormData(e.target));
      
      try {
        const res = await fetch('/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(d)
        });
        
        let responseText;
        try {
          const data = await res.json();
          responseText = JSON.stringify(data, null, 2);
          
          // 美化显示
          if (data.landingPage) {
            responseText += '\\n\\n🌐 落地页信息：';
            responseText += \`\\n• 类型: \${data.landingPage.type === 'independent' ? '独立部署' : '内置部署'}\`;
            responseText += \`\\n• URL: \${data.landingPage.url}\`;
            responseText += \`\\n• 环境变量: \${data.landingPage.envVar}\`;
          }
        } catch {
          responseText = await res.text();
        }
        
        if (res.ok) {
          r.textContent = '✅ 发送成功！\\n\\n' + responseText;
          r.style.borderLeftColor = '#4caf50';
          r.style.color = '#4caf50';
          
          // 添加预览链接
          try {
            const data = JSON.parse(responseText.split('✅ 发送成功！\\n\\n')[1] || responseText);
            if (data.landingPage && data.landingPage.url) {
              const previewBtn = document.createElement('a');
              previewBtn.href = data.landingPage.url;
              previewBtn.target = '_blank';
              previewBtn.textContent = '👁️ 预览落地页';
              previewBtn.style.display = 'block';
              previewBtn.style.marginTop = '10px';
              previewBtn.style.padding = '8px 16px';
              previewBtn.style.background = '#2196f3';
              previewBtn.style.color = 'white';
              previewBtn.style.borderRadius = '6px';
              previewBtn.style.textDecoration = 'none';
              previewBtn.style.textAlign = 'center';
              
              r.appendChild(previewBtn);
            }
          } catch {}
        } else {
          r.textContent = '❌ 发送失败！\\n状态码: ' + res.status + '\\n\\n' + responseText;
          r.style.borderLeftColor = '#f44336';
          r.style.color = '#f44336';
        }
        
        r.style.display = 'block';
      } catch (err) {
        r.textContent = '⚠️ 请求错误：' + err.message;
        r.style.display = 'block';
        r.style.borderLeftColor = '#ff9800';
        r.style.color = '#ff9800';
      } finally {
        b.disabled = false;
        b.innerHTML = '🚀 发送测试消息';
      }
    };
  </script>
</body>
</html>`, {
        headers: { 
          'Content-Type': 'text/html;charset=UTF-8',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // 6. 未匹配的路由
    return new Response('Not Found', { 
      status: 404,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
    });
  }
};
