/**
 * 交易类型智能分类工具
 * 调用服务端API进行交易类型识别
 * 如果API失败，返回null，使用当前策略（保持原样）
 */

interface ClassificationResult {
  flowType: "支出" | "收入" | "不计收支";
  industryType: string;
  reason?: string;
}

/**
 * 调用服务端API进行智能分类
 * 如果API失败，返回null，使用当前策略（保持原样）
 * 使用 $fetch 直接调用，避免经过 doApi 的错误处理
 */
export async function classifyTransaction(
  merchantName: string = "",
  description: string = "",
  amount: number = 0
): Promise<ClassificationResult | null> {
  // 如果信息不足，直接返回null，使用当前策略
  if (!merchantName && !description) {
    return null;
  }

  try {
    // 使用 doApi.post，但捕获错误避免弹出错误提示
    const result = await doApi.post<ClassificationResult | null>(
      "api/entry/flow/classifyType",
      {
        merchantName,
        description,
        amount,
      }
    );

    return result;
  } catch (error) {
    // 静默处理错误，不显示错误弹窗
    // 失败时返回null，保持原样（当前策略）
    return null;
  }
}

/**
 * 批量分类交易（带限流和错误处理）
 * 如果API失败，保持原样（当前策略）
 */
export async function classifyTransactionsBatch(
  transactions: Array<{
    merchantName?: string;
    description?: string;
    amount: number;
  }>,
  options?: {
    batchSize?: number; // 批次大小
    delay?: number; // 批次间延迟（毫秒）
  }
): Promise<Array<ClassificationResult | null>> {
  const { batchSize = 5, delay = 300 } = options || {};

  const results: Array<ClassificationResult | null> = [];

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    
    const batchPromises = batch.map((tx) => {
      return classifyTransaction(tx.merchantName, tx.description, tx.amount);
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // 批次间延迟，避免API限流
    if (i + batchSize < transactions.length && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return results;
}

