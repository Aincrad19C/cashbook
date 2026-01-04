import prisma from "~/lib/prisma";

/**
 * @swagger
 * /api/entry/flow/getMain:
 *   post:
 *     summary: 获取合并记录的主记录字段
 *     tags: ["Flow"]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             groupId: string 合并组ID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               Result:
 *                 d: FlowGroupMain | null 主记录数据
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!body.groupId) {
    return error("请提供groupId");
  }
  
  try {
    const main = await prisma.flowGroupMain.findUnique({
      where: { groupId: body.groupId },
    });
    
    return success(main);
  } catch (error: any) {
    // 如果 flowGroupMain 不存在，说明 Prisma Client 未更新
    if (error?.message?.includes('flowGroupMain') || error?.code === 'P2001') {
      console.error("Prisma Client 未更新，请运行: npx prisma generate");
      return success(null); // 返回 null 而不是错误，避免影响正常流程
    }
    throw error;
  }
});

