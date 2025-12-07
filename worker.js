/**
 * 【终极稳定版】统一微信推送网关
 * 功能：同时处理「短信转发器」和「哪吒面板」的Webhook，发送至微信模板消息
 * 模板：使用6字段模板，字段顺序为：类型、发信人、内容、SIM卡、时间、设备
 * 配置：所有敏感信息均通过环境变量设置，代码中无任何硬编码密钥。
 */
const CONFIG = {
  KV_TOKEN_KEY: "WX_ACCESS_TOKEN_FINAL", // Token在KV中存储的键名
  KV_TOKEN_EXPIRE: 7100, // Token缓存时间（微信有效期为7200秒，提前100秒刷新）
};

/**
 * 主请求处理函数
 * @param {Request} request 传入的请求对象
 * @param {Env} env 环境变量对象
 * @returns {Promise<Response>} 返回的响应
 */
export default {
  async fetch(request, env) {
    // --- 1. 基础验证与配置读取 ---
    // 仅处理POST请求
    if (request.method !== "POST") {
      return this.jsonResponse({ error: "Method not allowed. Use POST." }, 405);
    }

    // 从环境变量读取所有必要配置
    const {
      WX_APPID,
      WX_SECRET,
      WX_OPENID,
      WX_TEMPLATE_ID, // 微信6字段模板ID
      WECHAT_KV, // KV存储命名空间绑定
    } = env;

    // 检查关键配置是否缺失
    const missingConfigs = [];
    if (!WX_APPID) missingConfigs.push("WX_APPID");
    if (!WX_SECRET) missingConfigs.push("WX_SECRET");
    if (!WX_OPENID) missingConfigs.push("WX_OPENID");
    if (!WX_TEMPLATE_ID) missingConfigs.push("WX_TEMPLATE_ID");
    if (!WECHAT_KV) missingConfigs.push("WECHAT_KV");

    if (missingConfigs.length > 0) {
      return this.jsonResponse(
        { error: `Missing required environment variables: ${missingConfigs.join(", ")}` },
        500
      );
    }

    // --- 2. 解析请求数据并判断来源 ---
    let incomingData = {};
    try {
      incomingData = await request.json();
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return this.jsonResponse({ error: "Invalid JSON payload." }, 400);
    }

    console.log("Received data:", JSON.stringify(incomingData));

    let messageType;
    let templateData;

    // 判断逻辑：哪吒面板的告警数据通常包含 `alarmName` 或 `alarmLevel` 字段
    if (incomingData.alarmName || incomingData.alarmLevel) {
      console.log("Identified data source: NeZha Panel");
      messageType = "nezha";
      templateData = this.processNezhaData(incomingData);
    } else {
      console.log("Identified data source: SMS Forwarder (default)");
      messageType = "sms";
      templateData = this.processSmsData(incomingData);
    }

    // --- 3. 获取或刷新微信Access Token ---
    const accessToken = await this.getWechatAccessToken(WX_APPID, WX_SECRET, WECHAT_KV);
    if (!accessToken) {
      return this.jsonResponse({ error: "Failed to obtain WeChat access token." }, 500);
    }

    // --- 4. 构建符合6字段模板的微信请求体 ---
    // !!! 重要：此处的字段顺序和名称必须与你在微信公众平台申请的模板完全一致 !!!
    const wechatPayload = {
      touser: WX_OPENID,
      template_id: WX_TEMPLATE_ID, // 使用环境变量中的模板ID
      data: {
        first: {
          value: templateData.first,
          color: templateData.firstColor || "#E6A23C", // 默认橙色
        },
        keyword1: {
          // 类型
          value: templateData.keyword1,
          color: "#673AB7", // 紫色
        },
        keyword2: {
          // 发信人/主机
          value: templateData.keyword2,
          color: "#173177", // 深蓝色
        },
        keyword3: {
          // 内容/详情
          value: templateData.keyword3,
          color: "#000000", // 黑色
        },
        keyword4: {
          // SIM卡/状态
          value: templateData.keyword4,
          color: "#666666", // 深灰色
        },
        keyword5: {
          // 时间
          value: templateData.keyword5,
          color: "#999999", // 浅灰色
        },
        keyword6: {
          // 设备/IP
          value: templateData.keyword6,
          color: "#666666", // 深灰色
        },
        // 此模板不包含 remark 字段，故不发送
      },
    };

    console.log("WeChat payload to be sent:", JSON.stringify(wechatPayload));

    // --- 5. 发送模板消息至微信 ---
    const wechatResult = await this.sendWechatTemplateMessage(
      accessToken,
      wechatPayload
    );
    console.log("WeChat API response:", wechatResult);

    // --- 6. 返回处理结果 ---
    if (wechatResult.errcode === 0) {
      return this.jsonResponse({
        success: true,
        message: "WeChat template message sent successfully.",
        type: messageType,
        msgid: wechatResult.msgid,
        preview: `【预览】 ${templateData.first} | 类型：${templateData.keyword1} | 发信人：${templateData.keyword2}`,
      });
    } else {
      // 微信接口返回明确错误
      return this.jsonResponse(
        {
          success: false,
          error: `WeChat API error: ${wechatResult.errmsg}`,
          errcode: wechatResult.errcode,
          type: messageType,
        },
        502 // Bad Gateway
      );
    }
  },

/**
   * 处理来自短信转发器的数据
   * @param {object} data 原始JSON数据
   * @returns {object} 格式化后的模板数据对象
   */
  processSmsData(data) {
    // 安全获取字段值的辅助函数
    const getField = (obj, ...keys) => {
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
          return String(obj[key]).trim();
        }
      }
      return ""; 
    };

    // 提取字段
    const sender = getField(data, "from", "sender", "phone");
    const rawContent = getField(data, "msg", "content", "message", "sms");
    const deviceName = getField(data, "device", "device_name", "deviceName");
    const cardSlot = getField(data, "card_slot", "slot", "sim", "card");
    let receiveTime = getField(data, "time", "receive_time", "date");

    // 处理时间
    if (!receiveTime) {
      receiveTime = new Date().toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
        hour12: false,
      });
      receiveTime = receiveTime.replace(/\//g, "-");
    }

    // --- 修改部分开始 ---
    // 将限制从 100 提升到 600 (或者你可以直接去掉这个 if 判断使用全文)
    const limit = 600; 
    const content =
      rawContent.length > limit
        ? rawContent.substring(0, limit) + "..."
        : rawContent;
    // --- 修改部分结束 ---

    // 返回映射到6字段模板的数据对象
    return {
      first: "📱 收到新短信",
      keyword1: "短信通知", // 类型
      keyword2: sender || "未知号码", // 发信人
      keyword3: content || "无内容", // 内容
      keyword4: cardSlot, // SIM卡信息
      keyword5: receiveTime, // 接收时间
      keyword6: deviceName, // 设备名称
    };
  },

  /**
   * 处理来自哪吒面板的告警数据
   * @param {object} data 原始JSON数据
   * @returns {object} 格式化后的模板数据对象
   */
  processNezhaData(data) {
    const getField = (obj, ...keys) => {
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
          return String(obj[key]).trim();
        }
      }
      return "N/A";
    };

    const alarmName = getField(data, "alarmName", "name", "title");
    const alarmLevel = getField(data, "alarmLevel", "level", "status");
    const alarmDetail = getField(data, "alarmText", "message", "content");
    const alarmTarget = getField(data, "target", "hostname", "server", "ip");
    let alarmTime = getField(data, "alarmTime", "time", "createdAt");

    if (!alarmTime || alarmTime === "N/A") {
      alarmTime = new Date().toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
        hour12: false,
      });
      alarmTime = alarmTime.replace(/\//g, "-");
    }

    // 根据告警级别设置标题颜色
    let firstColor = "#E6A23C"; // 默认橙色
    if (alarmLevel.includes("警告") || alarmLevel.includes("error")) {
      firstColor = "#F56C6C"; // 红色
    } else if (alarmLevel.includes("正常") || alarmLevel.includes("ok")) {
      firstColor = "#67C23A"; // 绿色
    }

    // 返回映射到同一6字段模板的数据对象
    // 注意：字段语义根据哪吒数据做了适配调整
    return {
      first: `🚨 ${alarmName}`,
      firstColor: firstColor,
      keyword1: "哪吒监控", // 类型
      keyword2: alarmTarget, // 目标主机（对应“发信人”字段）
      keyword3: alarmDetail, // 告警详情（对应“内容”字段）
      keyword4: `等级：${alarmLevel}`, // 告警等级（对应“SIM卡”字段）
      keyword5: alarmTime, // 告警时间
      keyword6: getField(data, "ip", "location", "额外信息"), // 其他信息（对应“设备”字段）
    };
  },

  /**
   * 获取微信Access Token（带KV缓存）
   * @param {string} appId
   * @param {string} appSecret
   * @param {KVNamespace} kvStore
   * @returns {Promise<string|null>} Access Token 或 null
   */
  async getWechatAccessToken(appId, appSecret, kvStore) {
    // 1. 尝试从KV缓存读取
    let cachedToken = await kvStore.get(CONFIG.KV_TOKEN_KEY);
    if (cachedToken) {
      console.log("Using cached WeChat access token.");
      return cachedToken;
    }

    console.log("Cached token not found or expired. Requesting new one...");

    // 2. 向微信服务器请求新Token
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    try {
      const response = await fetch(tokenUrl);
      const result = await response.json();

      if (result.access_token) {
        const newToken = result.access_token;
        // 3. 将新Token存入KV，并设置过期时间
        await kvStore.put(CONFIG.KV_TOKEN_KEY, newToken, {
          expirationTtl: CONFIG.KV_TOKEN_EXPIRE,
        });
        console.log("New WeChat access token obtained and cached.");
        return newToken;
      } else {
        // 请求Token失败，记录微信返回的错误
        console.error(
          `Failed to get WeChat access token. ErrCode: ${result.errcode}, ErrMsg: ${result.errmsg}`
        );
        return null;
      }
    } catch (networkError) {
      console.error("Network error while fetching WeChat token:", networkError);
      return null;
    }
  },

  /**
   * 发送模板消息到微信
   * @param {string} accessToken
   * @param {object} payload
   * @returns {Promise<object>} 微信API的响应结果
   */
  async sendWechatTemplateMessage(accessToken, payload) {
    const apiUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error) {
      console.error("Failed to send message to WeChat API:", error);
      return {
        errcode: -1,
        errmsg: `Network error: ${error.message}`,
      };
    }
  },

  /**
   * 返回JSON格式的HTTP响应
   * @param {object} data 响应数据
   * @param {number} statusCode HTTP状态码
   * @returns {Response}
   */
  jsonResponse(data, statusCode = 200) {
    return new Response(JSON.stringify(data, null, 2), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  },
};
