/**
 * 交易类型智能分类API
 * 使用通义千问API进行交易类型识别
 */

import { success } from "~/server/utils/common";

interface ClassificationRequest {
  merchantName?: string;
  description?: string;
  amount: number;
}

interface ClassificationResult {
  flowType: "支出" | "收入" | "不计收支";
  industryType: string;
  reason?: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ClassificationRequest>(event);
  const config = useRuntimeConfig();

  // 获取API Key（从环境变量读取）
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    // 如果没有配置API Key，返回null，让前端使用规则分类
    return success(null);
  }

  const { merchantName = "", description = "", amount = 0 } = body;

  // 构建提示词
  const expenseTypes = ["饮食", "交通", "娱乐", "购物", "医疗", "教育", "住房", "其他"];
  const incomeTypes = ["工资", "奖金", "投资收益", "兼职", "其他"];

  const prompt = `请根据以下交易信息，识别交易类型和分类：

商户名称：${merchantName || "未知"}
交易描述：${description || "无"}
交易金额：${amount}

请按照以下规则进行分类：

1. **交易类型（flowType）**：必须是以下之一
   - "支出"：金额为负数或交易描述包含"支出"、"付款"、"消费"等
   - "收入"：金额为正数或交易描述包含"收入"、"收款"、"到账"、"退款"等
   - "不计收支"：转账、余额调整等

2. **支出类型（industryType）**：如果flowType是"支出"，从以下类型中选择最合适的一个：
   ${expenseTypes.map((t) => `   - ${t}`).join("\n")}

3. **收入类型（industryType）**：如果flowType是"收入"，从以下类型中选择最合适的一个：
   ${incomeTypes.map((t) => `   - ${t}`).join("\n")}

请以JSON格式返回结果，格式如下：
{
  "flowType": "支出" 或 "收入" 或 "不计收支",
  "industryType": "具体的分类名称",
  "reason": "简要说明分类理由"
}

只返回JSON，不要其他文字。`;

  try {
    const response = await $fetch<{
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    }>("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: {
        model: "qwen-turbo", // 使用turbo模型降低成本
        messages: [
          {
            role: "system",
            content: "你是一个专业的财务分类助手，能够根据交易信息准确识别交易类型和支出/收入分类。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3, // 降低随机性，提高准确性
        max_tokens: 200,
      },
    });

    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message.content;
      const result = parseClassificationResult(content);
      if (result) {
        return success(result);
      }
    }
  } catch (error) {
    console.error("通义千问API调用失败:", error);
    // 失败时返回null，让前端使用规则分类或保持原样
    return success(null);
  }

  return success(null);
});

/**
 * 解析API返回的分类结果
 */
function parseClassificationResult(content: string): ClassificationResult | null {
  try {
    // 尝试提取JSON（可能包含markdown代码块）
    let jsonStr = content.trim();

    // 移除可能的markdown代码块标记
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```\n?/g, "");
    }

    // 尝试提取JSON对象
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const result = JSON.parse(jsonStr);

    // 验证结果格式
    if (
      result.flowType &&
      ["支出", "收入", "不计收支"].includes(result.flowType) &&
      result.industryType
    ) {
      return {
        flowType: result.flowType,
        industryType: result.industryType,
        reason: result.reason,
      };
    }
  } catch (error) {
    console.error("解析分类结果失败:", error, "原始内容:", content);
  }

  return null;
}

