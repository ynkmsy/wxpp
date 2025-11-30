// WXPush - 微信模板消息推送服务
// 作者：SY
// 更新时间：2025
// 基于 Cloudflare Workers 实现，极简、高效、安全

// NEW: 统一参数提取函数，支持 GET/POST/JSON/FormData/Authorization
async function getParams(request) {
  const { searchParams } = new URL(request.url);
  const urlParams = Object.fromEntries(searchParams.entries());
  let bodyParams = {};

  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = (request.headers.get('content-type') || '').toLowerCase();
    try {
      if (contentType.includes('application/json')) {
        const json = await request.json();
        if (typeof json === 'string') {
          bodyParams = { content: json };
        } else if (json && typeof json === 'object') {
          bodyParams = json.params || json.data || json;
        }
      } else if (contentType.includes('form')) {
        const form = await request.formData();
        bodyParams = Object.fromEntries(form.entries());
      } else {
        const text = await request.text();
        try { bodyParams = JSON.parse(text); }
        catch { bodyParams = { content: text }; }
      }
    } catch (e) { console.error('Body parse error:', e); }
  }

  return { ...urlParams, ...bodyParams };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // === 交互测试页：/your-token ===
    const singleSeg = path.match(/^\/([^\/]+)\/?$/);
    if (singleSeg && !['wxsend', 'index.html', 'favicon.ico'].includes(singleSeg[1])) {
      const token = singleSeg[1];
      if (token !== env.API_TOKEN) {
        return new Response('Forbidden', { status: 403 });
      }

      const safeToken = token.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

      const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>WXPush 测试控制台 - SY</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --card: rgba(255, 255, 255, 0.15);
      --border: rgba(255, 255, 255, 0.2);
      --text: #ffffff;
      --accent: #a78bfa;
      --success: #10b981;
      --error: #ef4444;
    }
    body { 
      font-family: 'Inter', system-ui, sans-serif; 
      background: var(--bg); 
      color: var(--text); 
      margin:0; min-height:100vh; 
      display:grid; place-items:center;
      padding:16px; box-sizing:border-box;
    }
    .card {
      background: var(--card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      padding: 40px;
      width: 100%;
      max-width: 680px;
      animation: fadeIn 0.6s ease-out;
    }
    @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
    h1 {
      margin:0 0 8px;
      font-size: 36px;
      font-weight: 700;
      background: linear-gradient(90deg, #c084fc, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-align:center;
    }
    .subtitle {
      text-align:center; opacity:0.9; font-size:15px; margin-bottom:24px;
    }
    label { display:block; margin:20px 0 8px; font-weight:600; }
    input, textarea {
      width:100%; padding:14px;
      background: rgba(255,255,255,0.2);
      border:1px solid var(--border);
      border-radius:12px;
      color:white; font-size:14px;
      transition:all 0.3s;
    }
    input:focus, textarea:focus {
      outline:none;
      background:rgba(255,255,255,0.3);
      box-shadow:0 0 0 3px rgba(167,139,250,0.3);
    }
    textarea { resize:vertical; min-height:100px; }
    .btns { display:flex; gap:12px; margin-top:24px; }
    button {
      flex:1; padding:14px;
      border:none; border-radius:12px;
      font-weight:600; cursor:pointer;
      transition:all 0.3s;
    }
    #sendBtn {
      background: var(--accent);
      color: white;
    }
    #sendBtn:hover { background:#8b5cf6; transform:translateY(-2px); }
    #sendBtn:disabled { opacity:0.6; cursor:not-allowed; }
    #clearBtn {
      background: rgba(255,255,255,0.15);
      color: white;
      border:1px solid var(--border);
    }
    #clearBtn:hover { background:rgba(255,255,255,0.25); }
    #response {
      margin-top:24px; padding:16px;
      border-radius:12px; background:rgba(0,0,0,0.3);
      display:none; white-space:pre-wrap; font-family:monospace;
    }
    .success { border-left:4px solid var(--success); }
    .error { border-left:4px solid var(--error); }
    .author {
      text-align:center; margin-top:32px; opacity:0.7; font-size:14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>WXPush</h1>
    <p class="subtitle">微信模板消息测试控制台</p>
    <form id="form">
      <label>标题 title</label>
      <input name="title" value="来自 SY 的消息" required>
      <label>内容 content</label>
      <textarea name="content" required>这是一条由 SY 精心调教后的美化版本推送～\n\n时间：{{now}}</textarea>
      <label>用户 userid（多个用 | 分隔）</label>
      <input name="userid" placeholder="uid1|uid2">
      <label>模板ID template_id（可选）</label>
      <input name="template_id">
      <label>跳转链接 base_url（可选）</label>
      <input name="base_url" value="">
      <input type="hidden" name="token" value="${safeToken}">
      <div class="btns">
        <button type="submit" id="sendBtn">发送消息</button>
        <button type="button" id="clearBtn">清空</button>
      </div>
    </form>
    <pre id="response"></pre>
    <div class="author">Designed with ❤ by <strong>SY</strong></div>
  </div>

  <script>
    const form = document.getElementById('form');
    const sendBtn = document.getElementById('sendBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resp = document.getElementById('response');

    clearBtn.onclick = () => form.reset() || (resp.style.display='none');

    form.onsubmit = async e => {
      e.preventDefault();
      sendBtn.disabled = true;
      sendBtn.textContent = '发送中...';
      resp.style.display = 'none';

      const data = Object.fromEntries(new FormData(form));
      try {
        const res = await fetch('/wxsend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const text = await res.text();
        resp.textContent = 'Status: ' + res.status + '\\n\\n' + text;
        resp.className = res.ok ? 'success' : 'error';
      } catch (err) {
        resp.textContent = '请求失败：' + err.message;
        resp.className = 'error';
      } finally {
        resp.style.display = 'block';
        sendBtn.disabled = false;
        sendBtn.textContent = '发送消息';
      }
    };
  </script>
</body>
</html>`;
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // === 主页 ===
    if (request.method === 'GET' && (path === '/' || path === '/index.html')) {
      const home = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>WXPush - 由 SY 驱动</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root { --bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%); --accent: #a78bfa; }
    body { font-family: 'Inter', sans-serif; background:var(--bg); color:white; margin:0; min-height:100vh; display:grid; place-items:center; padding:20px; }
    .card { background:rgba(255,255,255,0.15); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.2); border-radius:28px; padding:48px 40px; max-width:560px; text-align:center; box-shadow:0 25px 50px rgba(0,0,0,0.3); }
    h1 { font-size:48px; margin:0 0 16px; background:linear-gradient(90deg,#ddd6fe,#c4b5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
    p { opacity:0.9; line-height:1.7; font-size:17px; }
    .author { margin:32px 0 16px; font-size:15px; opacity:0.8; }
    .btn { display:inline-flex; align-items:center; gap:10px; background:rgba(255,255,255,0.2); padding:14px 28px; border-radius:99px; text-decoration:none; color:white; font-weight:600; margin:8px; transition:all 0.3s; }
    .btn:hover { background:rgba(255,255,255,0.3); transform:translateY(-3px); }
    .logo { width:28px; height:28px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>WXPush</h1>
    <p>极简、高效、稳定的微信模板消息推送服务<br>支持 Cloudflare Workers 一键部署</p>
    <div class="author">作者：<strong>SY</strong></div>
    <div style="margin-top:32px">
      <a class="btn" href="https://github.com/yourname" target="_blank">
        <svg class="logo" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.93 3.2 9.11 7.64 10.59...（GitHub图标）"/></svg>
        GitHub
      </a>
    </div>
    <div style="margin-top:40px;opacity:0.7;font-size:14px;">
      部署后访问 <code>/你的token</code> 即可进入测试控制台
    </div>
  </div>
</body>
</html>`;
      return new Response(home, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // === 发送接口 /wxsend ===
    if (path === '/wxsend') {
      const p = await getParams(request);
      const { title, content, token, userid, appid, secret, template_id, base_url } = p;

      let authToken = token || request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
      if (!authToken || authToken !== env.API_TOKEN) {
        return new Response('Invalid token', { status: 403 });
      }
      if (!title || !content) {
        return new Response('Missing title or content', { status: 400 });
      }

      const finalAppId = appid || env.WX_APPID;
      const finalSecret = secret || env.WX_SECRET;
      const userList = (userid || env.WX_USERID || '').split('|').map(s => s.trim()).filter(Boolean);
      const tmplId = template_id || env.WX_TEMPLATE_ID;
      const baseUrl = base_url || env.WX_BASE_URL || '';

      if (!finalAppId || !finalSecret || userList.length === 0 || !tmplId) {
        return new Response('Missing required config', { status: 500 });
      }

      try {
        const accessToken = await getStableToken(finalAppId, finalSecret);
        const results = await Promise.all(
          userList.map(uid => sendMessage(accessToken, uid, tmplId, baseUrl, title, content))
        );
        const success = results.filter(r => r.errmsg === 'ok');
        return new Response(
          success.length
            ? `成功发送 ${success.length}/${userList.length} 条`
            : `全部失败：${results[0]?.errmsg || 'unknown'}`,
          { status: success.length ? 200 : 500 }
        );
      } catch (e) {
        return new Response('Server Error: ' + e.message, { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};

// 获取 stable_token
async function getStableToken(appid, secret) {
  const res = await fetch('https://api.weixin.qq.com/cgi-bin/stable_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credential', appid, secret })
  });
  const data = await res.json();
  return data.access_token;
}

// 发送模板消息
async function sendMessage(token, touser, template_id, url, title, content) {
  const beijingTime = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
  const payload = {
    touser,
    template_id,
    url: `${url}?title=${encodeURIComponent(title)}&message=${encodeURIComponent(content)}&date=${encodeURIComponent(beijingTime)}`,
    data: { title: { value: title }, content: { value: content } }
  };
  const res = await fetch(`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}
