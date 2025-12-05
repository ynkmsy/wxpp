/**
 * WeChat Pusher (Smart Cleaner Version) - 修复版
 */
const CONFIG = {
  WX_TEMPLATE_ID: "",
  WX_APPID: "",
  WX_SECRET: "",
  WX_OPENID: "",
  KV_BINDING_NAME: "WECHAT_KV"
};

export default {
  async fetch(request, env, ctx) {
    // 优先读取环境变量
    const appId = env.WX_APPID || CONFIG.WX_APPID;
    const appSecret = env.WX_SECRET || CONFIG.WX_SECRET;
    const userOpenId = env.WX_OPENID || CONFIG.WX_OPENID;
    const templateId = env.WX_TEMPLATE_ID || CONFIG.WX_TEMPLATE_ID;
    const kvStore = env.WECHAT_KV; // 推荐直接绑定 WECHAT_KV

    if (!appId || !appSecret || !userOpenId || !templateId) {
      return new Response(JSON.stringify({
        "错误": "缺少必要配置",
        "提示": "请在 Workers 环境变量中设置 WX_APPID, WX_SECRET, WX_OPENID, WX_TEMPLATE_ID"
      }), { status: 400, headers: { "content-type": "application/json" } });
    }

    let body = {};
    try {
      if (request.method === "POST") body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ "错误": "无效的JSON" }), { status: 400 });
    }

    // === 1. 获取 access_token ===
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const tokenResp = await fetch(tokenUrl);
    const tokenData = await tokenResp.json();

    if (!tokenData.access_token) {
      const errMsg = tokenData.errmsg || "未知错误";
      const commonTips = {
        "invalid appid": "AppID 错误或未认证",
        "invalid secret": "AppSecret 错误",
        "appsecret missing": "AppSecret 未填写"
      };
      return new Response(JSON.stringify({
        "获取Token失败": errMsg,
        "提示": commonTips[errMsg] || "请检查 AppID 和 Secret 是否正确、账号是否认证"
      }), { status: 500, headers: { "content-type": "application/json" } });
    }

    // === 2. 强力清洗数据 ===
    const cleanStr = (val) => String(val || "无").replace(/^(发信人|内容|消息|短信内容|设备|时间|Sender|Content|Device|Time|From|Msg)[:：\s]*/gi, "").trim();

    let rawSender = cleanStr(body.from || body.sender || "系统");
    let rawContent = cleanStr(body.content || body.msg || body.message || "无内容");
    let rawDevice = cleanStr(body.device_name || body.device || "Cloudflare Workers");

    // 时间处理 - 标准化为北京时间
    const now = new Date();
    const bjTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
    const timeStr = bjTime.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).replace(/\//g, '-');

    let rawTime = body.receive_time || timeStr;

    // 标题处理
    let title = body.title || "新消息通知";
    if (body.server_name) { // 哪吒面板专属
      title = "服务器报警";
      rawSender = "哪吒监控";
      rawDevice = body.server_name;
      rawContent = body.message || "状态异常";
    }

    // 安全截取内容（避免表情符号被截断）
    const safeSubstr = (str, len) => {
      const arr = [...str];
      return arr.slice(0, len).join("") + (arr.length > len ? "..." : "");
    };

    // === 3. 构造模板消息 ===
    const wxPayload = {
      touser: userOpenId,
      template_id: templateId,  // 关键修复！
      url: body.url || "",      // 可选：点击跳转链接
      data: {
        first: { value: `通知 ${title}`, color: "#E6A23C" },
        keyword1: { value: rawSender, color: "#173177" },
        keyword2: { value: safeSubstr(rawContent, 100), color: "#000000" },
        keyword3: { value: rawDevice, color: "#666666" },
        keyword4: { value: rawTime, color: "#666666" },
        remark: { value: "来自 Cloudflare Workers 推送", color: "#888888" }
      }
    };

    // === 4. 发送消息 ===
    const sendUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${tokenData.access_token}`;
    const wxResponse = await fetch(sendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wxPayload)
    });

    const result = await wxResponse.json();

    if (result.errcode === 0) {
      return new Response(JSON.stringify({ "成功": "微信推送成功" }), { headers: { "content-type": "application/json" } });
    } else {
      return new Response(JSON.stringify({
        "微信推送失败": result.errmsg,
        "errcode": result.errcode
      }), { status: 500, headers: { "content-type": "application/json" } });
    }
  }
};
