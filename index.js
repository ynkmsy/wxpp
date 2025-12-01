// WX Message Push - 微信模板消息推送服务

async function getParams(request) {
  const { searchParams } = new URL(request.url);
  const urlParams = Object.fromEntries(searchParams.entries());
  let bodyParams = {};
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const ct = (request.headers.get('content-type') || '').toLowerCase();
    try {
      if (ct.includes('json')) {
        const j = await request.json();
        bodyParams = j.params || j.data || j;
      } else if (ct.includes('form')) {
        bodyParams = Object.fromEntries((await request.formData()).entries());
      } else {
        const t = await request.text();
        try { bodyParams = JSON.parse(t); } catch { bodyParams = { content: t }; }
      }
    } catch (e) {}
  }
  return { ...urlParams, ...bodyParams };
}

const GITHUB_URL = "https://github.com/ynkmsy/wxpp";

// 手机适配落地页
const LANDING_PAGE_HTML = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{TITLE}}</title><script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>
* {margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI','Microsoft YaHei',sans-serif;}
body {background:linear-gradient(135deg,#0f0c29,#1a1a3e);color:#e0f7fa;min-height:100vh;display:flex;justify-content:center;align-items:center;padding:16px;position:relative;overflow:hidden;}
body::before {content:'';position:absolute;top:0;left:0;width:100%;height:100%;background:radial-gradient(circle at 15% 35%,rgba(0,150,136,0.18),transparent 50%),radial-gradient(circle at 85% 70%,rgba(0,188,212,0.15),transparent 50%);z-index:-1;}
.container {max-width:760px;width:100%;background:rgba(18,18,40,0.95);backdrop-filter:blur(16px);border-radius:18px;padding:36px 28px;box-shadow:0 16px 48px rgba(0,0,0,0.7),0 0 0 1px rgba(0,150,136,0.3),0 0 32px rgba(0,188,212,0.35);position:relative;overflow:hidden;}
.container::before {content:'';position:absolute;top:0;left:0;width:100%;height:5px;background:linear-gradient(90deg,#00bfa5,#00acc1);}
.title {font-size:1.68rem;text-align:center;margin-bottom:34px;color:#00bfa5;letter-spacing:1.8px;line-height:1.4;position:relative;}
.title::after {content:'';position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);width:90px;height:2.5px;background:linear-gradient(90deg,transparent,#00bfa5,transparent);}
.info-card {background:rgba(25,30,65,0.88);border-left:4px solid #00bfa5;border-radius:12px;padding:22px;margin:22px 0;box-shadow:0 6px 18px rgba(0,0,0,0.4);}
.info-label {font-size:1.08rem;color:#80deea;margin-bottom:11px;display:flex;align-items:center;font-weight:600;}
.info-label::before {content:'';width:8px;height:8px;background:#00bfa5;border-radius:50%;margin-right:11px;flex-shrink:0;}
.info-content {font-size:1.06rem;color:#e0f7fa;line-height:1.8;white-space:pre-line;}
.footer {text-align:center;margin-top:46px;opacity:0.78;font-size:13.5px;}
.github a {color:#00bfa5;text-decoration:none;display:inline-flex;align-items:center;gap:8px;margin-top:9px;}
.particles {position:absolute;top:0;left:0;width:100%;height:100%;z-index:-1;overflow:hidden;}
.particle {position:absolute;background:rgba(0,191,165,0.25);border-radius:50%;animation:float 16s infinite linear;}
@keyframes float {0%{transform:translateY(100vh);opacity:0;}12%{opacity:1;}88%{opacity:1;}100%{transform:translateY(-120px) translateX(80px);opacity:0;}}
@media (max-width:480px){.container{padding:28px 20px;}.title{font-size:1.55rem;}}
</style></head>
<body>
<div class="particles" id="p"></div>
<div class="container">
  <h1 class="title">{{TITLE}}</h1>
  <div class="info-card"><div class="info-label">通知内容</div><div class="info-content" id="msg">{{MESSAGE}}</div></div>
  <div class="info-card"><div class="info-label">时间</div><div class="info-content">{{DATE}}</div></div>
  <div class="footer">
    Powered by <strong>SY</strong>
    <div class="github"><a href="${GITHUB_URL}" target="_blank">
      <svg height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
      GitHub
    </a></div>
  </div>
</div>
<script>
for(let i=0;i<26;i++){let e=document.createElement('div');e.className='particle';e.style.width=e.style.height=(Math.random()*3+1)+'px';e.style.left=Math.random()*100+'%';e.style.animationDelay=Math.random()*16+'s';e.style.animationDuration=(18+Math.random()*22)+'s';document.getElementById('p').appendChild(e);}
document.getElementById('msg').innerHTML = marked.parse(document.getElementById('msg').textContent);
</script>
</body></html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. 详情落地页
    if (request.method === 'GET' && (url.searchParams.has('title') || url.searchParams.has('message'))) {
      const title = url.searchParams.get('title') || 'SY的消息通知';
      const message = url.searchParams.get('message') || '暂无内容';
      const date = url.searchParams.get('date') || new Date(Date.now() + 8*3600000).toISOString().slice(0,19).replace('T',' ');
      const html = LANDING_PAGE_HTML.replace(/{{TITLE}}/g, title).replace(/{{MESSAGE}}/g, message).replace(/{{DATE}}/g, date);
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // 2. 测试控制台
    const tokenMatch = path.match(/^\/([^\/]+)\/?$/);
    if (tokenMatch && !['wxsend','favicon.ico'].includes(tokenMatch[1])) {
      if (tokenMatch[1] !== env.API_TOKEN) return new Response('Forbidden', {status:403});
      const safeToken = tokenMatch[1].replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

      return new Response(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>WX Message Push 测试控制台</title>
  <style>
    :root{--bg:linear-gradient(135deg,#667eea,#764ba2);--card:rgba(255,255,255,0.15);--accent:#a78bfa;}
    body{background:var(--bg);color:#fff;font-family:system-ui;margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;}
    .card{background:var(--card);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.2);border-radius:24px;padding:40px;max-width:680px;width:100%;box-shadow:0 20px 40px rgba(0,0,0,0.3);}
    h1{font-size:36px;margin:0 0 8px;background:linear-gradient(90deg,#c084fc,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-align:center;}
    label{display:block;margin:20px 0 8px;font-weight:600;}
    input,textarea{width:100%;padding:14px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);border-radius:12px;color:white;font-size:14px;}
    button{margin-top:24px;padding:14px 32px;background:var(--accent);border:none;border-radius:12px;color:white;font-weight:600;cursor:pointer;}
    #resp{margin-top:24px;padding:16px;background:rgba(0,0,0,0.3);border-radius:12px;display:none;white-space:pre-wrap;font-family:monospace;}
    .author{text-align:center;margin-top:32px;opacity:0.8;font-size:15px;}
  </style>
</head>
<body>
  <div class="card">
    <h1>WX Message Push</h1>
    <p style="text-align:center;margin-bottom:24px;opacity:0.9;">微信模板消息测试控制台</p>
    <form id="f">
      <label>标题</label><input name="title" value="SY的消息通知" required>
      <label>内容（支持 Markdown）</label><textarea name="content" rows="5" required>这是一条超美推送</textarea>
      <label>用户ID（|分隔）</label><input name="userid" placeholder="留空使用环境变量">
      <input type="hidden" name="token" value="${safeToken}">
      <button type="submit">发送消息</button>
    </form>
    <pre id="resp"></pre>
    <div class="author">Made with ❤ by <strong>SY</strong></div>
  </div>
  <script>
    document.getElementById('f').onsubmit=async e=>{e.preventDefault();
      const b=e.target.querySelector('button'),r=document.getElementById('resp');
      b.disabled=true;b.textContent='发送中...';r.style.display='none';
      const d=Object.fromEntries(new FormData(e.target));
      try{
        const res=await fetch('/wxsend',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
        const t=await res.text();r.textContent='Status: '+res.status+'\\n\\n'+t;
        r.style.display='block';r.style.borderLeft=res.ok?'4px solid #10b981':'4px solid #ef4444';
      }catch(err){r.textContent='错误：'+err.message;r.style.display='block';}
      finally{b.disabled=false;b.textContent='发送消息';}
    };
  </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // 3. 推送接口 /wxsend（保持原样）
    if (path === '/wxsend') {
      const p = await getParams(request);
      const { title, content, token, userid, appid, secret, template_id } = p;
      const authToken = token || request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
      if (!authToken || authToken !== env.API_TOKEN) return new Response('Invalid token', {status:403});
      if (!title || !content) return new Response('Missing title/content', {status:400});

      const finalAppId = appid || env.WX_APPID;
      const finalSecret = secret || env.WX_SECRET;
      const userList = (userid || env.WX_USERID || '').split('|').map(s=>s.trim()).filter(Boolean);
      const tmplId = template_id || env.WX_TEMPLATE_ID;
      const baseUrl = (env.WX_BASE_URL || '').replace(/\/+$/, '');

      if (!finalAppId || !finalSecret || userList.length===0 || !tmplId) return new Response('Missing config', {status:500});

      try {
        const accessToken = await getStableToken(finalAppId, finalSecret);
        const now = new Date(Date.now() + 8*3600000).toISOString().slice(0,19).replace('T',' ');
        const jumpUrl = `${baseUrl}?title=${encodeURIComponent(title)}&message=${encodeURIComponent(content)}&date=${encodeURIComponent(now)}`;

        const results = await Promise.all(userList.map(uid => 
          fetch(`https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({touser:uid,template_id:tmplId,url:jumpUrl,data:{title:{value:title},content:{value:content}}})
          }).then(r=>r.json())
        ));

        const ok = results.filter(r=>r.errmsg==='ok');
        return new Response(ok.length ? `成功 ${ok.length}/${userList.length}` : `失败：${results[0]?.errmsg||'unknown'}`, {status: ok.length?200:500});
      } catch (e) { return new Response('Error: '+e.message, {status:500}); }
    }

    // 4. 主页
    if (path === '/' || path === '/index.html') {
      return new Response(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>WX Message Push by SY</title>
<style>
  body{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;}
  .card{background:rgba(255,255,255,0.15);backdrop-filter:blur(20px);border-radius:28px;padding:60px 40px;text-align:center;max-width:540px;box-shadow:0 20px 40px rgba(0,0,0,0.3);}
  h1{font-size:48px;background:linear-gradient(90deg,#ddd6fe,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;}
  p{opacity:0.9;line-height:1.7;margin:20px 0;font-size:17px;}
  .author{margin:36px 0 16px;font-size:16px;opacity:0.85;}
  .github a{color:#000 !important;font-weight:800;background:rgba(255,255,255,0.95);padding:14px 28px;border-radius:99px;display:inline-flex;align-items:center;gap:12px;text-decoration:none;transition:all .3s;box-shadow:0 4px 15px rgba(0,0,0,0.1);}
  .github a:hover{background:#fff;transform:translateY(-4px);box-shadow:0 12px 28px rgba(0,0,0,0.2);}
  .tip{margin-top:32px;font-size:14px;opacity:0.8;background:rgba(255,255,255,0.1);padding:12px 20px;border-radius:12px;}
  code{background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:6px;font-family:monospace;}
</style></head>
<body>
<div class="card">
  <h1>WX Message Push</h1>
  <p>一个 Worker 实现超美微信模板消息推送</p>
  <div class="author">作者：<strong>SY</strong></div>
  <div class="github"><a href="${GITHUB_URL}" target="_blank">
    <svg height="26" viewBox="0 0 16 16" fill="#000"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
    查看 GitHub 源码
  </a></div>
  <div class="tip">部署后访问 <code>/你的token</code> 即可进入测试控制台</div>
</div>
</body></html>`, {headers:{'Content-Type':'text/html;charset=utf-8'}});
    }

    return new Response('Not Found', {status:404});
  }
};

async function getStableToken(appid, secret) {
  const r = await fetch('https://api.weixin.qq.com/cgi-bin/stable_token', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({grant_type:'client_credential', appid, secret})
  });
  const d = await r.json();
  return d.access_token;
}
