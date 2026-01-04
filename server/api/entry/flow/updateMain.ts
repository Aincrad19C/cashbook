import prisma from "~/lib/prisma";

/**
 * @swagger
 * /api/entry/flow/updateMain:
 *   post:
 *     summary: 更新合并记录的主记录字段（主记录字段独立存储）
 *     tags: ["Flow"]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             bookId: string 账本ID
 *             groupId: string 合并组ID
 *             flowType: string 流水类型（收入、支出）
 *             industryType: string 行业分类
 *             payType: string 支付方式
 *             name: string 流水名称
 *             money: number 金额
 *             description: string 描述
 *     responses:
 *       200:
 *         description: 主记录更新成功
 *         content:
 *           application/json:
 *             schema:
 *               Result:
 *                 d: FlowGroupMain 主记录数据
 *       400:
 *         description: 更新失败
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!body.groupId || !body.bookId) {
    return error("请提供groupId和bookId");
  }
  
  const userId = await getUserId(event);
  
  // 检查合并组是否存在
  const groupFlows = await prisma.flow.findMany({
    where: {
      groupId: body.groupId,
      bookId: body.bookId,
    },
    take: 1, // 只需要检查是否存在
  });
  
  if (groupFlows.length === 0) {
    return error("合并组不存在");
  }
  
  try {
    // 查找或创建主记录
    const existingMain = await prisma.flowGroupMain.findUnique({
      where: { groupId: body.groupId },
    });
    
    const mainData = {
      groupId: body.groupId,
      bookId: body.bookId,
      userId: userId,
      flowType: String(body.flowType || ""),
      industryType: String(body.industryType || ""),
      payType: String(body.payType || ""),
      money: body.money ? Number(body.money) : null,
      name: String(body.name || ""),
      description: String(body.description || ""),
      attribution: String(body.attribution || ""),
    };
    
    let result;
    if (existingMain) {
      // 更新现有主记录
      result = await prisma.flowGroupMain.update({
        where: { groupId: body.groupId },
        data: mainData,
      });
    } else {
      // 创建新主记录
      result = await prisma.flowGroupMain.create({
        data: mainData,
      });
    }
    
    return success(result);
  } catch (error: any) {
    // 如果 flowGroupMain 不存在，说明 Prisma Client 未更新
    if (error?.message?.includes('flowGroupMain') || error?.code === 'P2001') {
      console.error("Prisma Client 未更新，请运行: npx prisma generate");
      return error("主记录功能未初始化，请运行: npx prisma generate 和 npx prisma db push");
    }
    throw error;
  }
});

