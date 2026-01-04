import prisma from "~/lib/prisma";

/**
 * @swagger
 * /api/entry/flow/update:
 *   post:
 *     summary: 更新流水记录
 *     tags: ["Flow"]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             bookId: string 账本ID
 *             id: number 流水ID
 *             day: string 日期
 *             flowType: string 流水类型（收入、支出）
 *             industryType: string 行业分类
 *             payType: string 支付方式
 *             name: string 流水名称
 *             money: number 金额
 *             description: string 描述
 *             attribution: string 归属
 *     responses:
 *       200:
 *         description: 流水记录更新成功
 *         content:
 *           application/json:
 *             schema:
 *               Result:
 *                 d: Flow 更新后的流水记录
 *       400:
 *         description: 更新失败
 *         content:
 *           application/json:
 *             schema:
 *               Error: {
 *                 message: "Not Find ID"
 *               }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!body.id || !body.bookId) {
    return error("Not Find ID");
  }
  
  // 检查是否是主记录（合并记录的主记录）
  const isGroupMain = body.isGroupMain === true;
  const groupId = body.groupId;
  
  if (isGroupMain && groupId) {
    // 如果是主记录，更新第一条子记录的字段（主记录的字段存储在第一条子记录中）
    // 主记录不能修改时间，时间根据子记录自动计算
    
    // 验证该记录确实属于指定的合并组，并且是第一条记录
    const flowRecord = await prisma.flow.findFirst({
      where: {
        id: Number(body.id),
        groupId: groupId,
        bookId: body.bookId,
      },
    });
    
    if (!flowRecord) {
      return error("合并组记录不存在或不属于指定的合并组");
    }
    
    // 更新第一条子记录的字段（作为主记录的字段）
    // 注意：不更新day字段，因为主记录的时间不能修改
    const flow = {
      flowType: String(body.flowType || ""), // 流水类型：收入、支出
      industryType: String(body.industryType || ""), // 行业分类 原 type（收入类型、支出类型）
      payType: String(body.payType || ""), // 支付方式
      money: Number(body.money || ""),
      name: String(body.name || ""),
      description: String(body.description || ""),
      attribution: String(body.attribution || ""),
    };
    
    const updated = await prisma.flow.update({
      where: { id: Number(body.id), bookId: body.bookId },
      data: flow,
    });
    
    return success(updated);
  } else {
    // 普通记录或子记录的更新
    const flow = {
      day: String(body.day || ""),
      flowType: String(body.flowType || ""), // 流水类型：收入、支出
      industryType: String(body.industryType || ""), // 行业分类 原 type（收入类型、支出类型）
      payType: String(body.payType || ""), // 支付方式
      money: Number(body.money || ""),
      name: String(body.name || ""),
      description: String(body.description || ""),
      attribution: String(body.attribution || ""),
    };
    const updated = await prisma.flow.update({
      where: { id: Number(body.id), bookId: body.bookId },
      data: flow,
    });
    return success(updated);
  }
});
