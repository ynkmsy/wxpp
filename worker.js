

function generateLandingPageHTML(title, message, date) {

  const bg = "linear-gradient(160deg,#d0e0ff,#ffffff)";
  const cardBg = "rgba(255,255,255,0.85)";
  const accent = "#007aff";
  const textColor = "#333";

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:'SF Pro Display','Segoe UI',sans-serif;}
body{background:${bg};display:flex;justify-content:center;align-items:center;min-height:100vh;padding:16px;overflow-x:hidden;position:relative;}
.container{max-width:720px;width:100%;background:${cardBg};backdrop-filter:blur(24px);border-radius:28px;padding:36px;box-shadow:0 16px 48px rgba(0,0,0,0.12);position:relative;overflow:hidden;}
.title{font-size:1.7rem;color:${accent};text-align:center;margin-bottom:24px;font-weight:600;}
.info-card{background:rgba(255,255,255,0.9);border-left:4px solid ${accent};border-radius:12px;padding:18px;margin:18px 0;box-shadow:0 4px 12px rgba(0,0,0,0.08);}
.info-label{font-weight:600;color:${accent};margin-bottom:8px;}
.info-content{color:${textColor};white-space:pre-line;line-height:1.6;}
.footer{text-align:center;margin-top:32px;font-size:13px;color:#666;}
.particles{position:absolute;top:0;left:0;width:100%;height:100%;z-index:-1;overflow:hidden;}
.particle{position:absolute;background:rgba(0,122,255,0.25);border-radius:50%;animation:float 16s infinite linear;}
@keyframes float{0%{transform:translateY(100vh);opacity:0;}12%{opacity:1;}88%{opacity:1;}100%{transform:translateY(-120px) translateX(80px);opacity:0;}}
@media(max-width:480px){.container{padding:28px 20px;}.title{font-size:1.55rem;}}

</style>
</head>
<body>
<div class="particles" id="particles"></div>
<div class="container">
<h1 class="title">${title}</h1>
<div class="info-card">
<div class="info-label">消息内容</div>
<div class="info-content" id="msg">${message}</div>
</div>
<div class="info-card">
<div class="info-label">时间</div>
<div class="info-content">${date}</div>
</div>
<div class="footer">Powered by <strong>SY</strong></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
for(let i=0;i<26;i++){
  let e=document.createElement('div');
  e.className='particle';
  e.style.width=e.style.height=(Math.random()*3+2)+'px';
  e.style.left=Math.random()*100+'%';
  e.style.animationDelay=Math.random()*16+'s';
  e.style.animationDuration=(18+Math.random()*22)+'s';
  document.getElementById('particles').appendChild(e);
}
document.getElementById('msg').innerHTML = marked.parse(document.getElementById('msg').textContent);
</script>
</body>
</html>`;
}

async function sendWeChatMessage(content, env) {
  const tokenResp = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${env.WX_APPID}&secret=${env.WX_SECRET}`);
  const tokenData = await tokenResp.json();
  if(!tokenData.access_token) throw new Error(tokenData.errmsg || "获取 access_token 失败");
  const access_token = tokenData.access_token;

  const sendResp = await fetch(`https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${access_token}`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      touser: env.WX_OPENID,
      msgtype:"text",
      text:{content}
    })
  });
  return await sendResp.json();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 落地页
    if(request.method==="GET" && (url.searchParams.has("title") || url.searchParams.has("message"))) {
      const title = url.searchParams.get("title") || "SY的消息通知";
      const message = url.searchParams.get("message") || "暂无内容";
      const date = url.searchParams.get("date") || new Date(Date.now()+8*3600000).toISOString().slice(0,19).replace("T"," ");
      const html = generateLandingPageHTML(title,message,date);
      return new Response(html,{headers:{"Content-Type":"text/html;charset=UTF-8"}});
    }

    // Webhook 推送
    if(request.method==="POST") {
      let data={};
      try{ data = await request.json(); }catch{return new Response("Invalid JSON",{status:400});}
      const content = data.content || "";
      if(!content) return new Response("消息内容为空",{status:400});
      try{
        const result = await sendWeChatMessage(content, env);
        return new Response(JSON.stringify(result),{status:200});
      }catch(e){ return new Response("微信接口发送失败: "+e.message,{status:500}); }
    }

   
    return new Response("WX Message Push Worker by SY",{status:200});
  }
};
