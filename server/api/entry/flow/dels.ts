import prisma from "~/lib/prisma";

/**
 * @swagger
 * /api/entry/flow/dels:
 *   post:
 *     summary: 批量删除流水记录
 *     tags: ["Flow"]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             ids: number[] 流水ID数组
 *             bookId: string 账本ID
 *     responses:
 *       200:
 *         description: 批量删除成功
 *         content:
 *           application/json:
 *             schema:
 *               Result:
 *                 d: number 删除的记录数量
 *       400:
 *         description: 删除失败
 *         content:
 *           application/json:
 *             schema:
 *               Error: {
 *                 message: "Not Find ID"
 *               }
 */
export default defineEventHandler(async (event) => {
  const { ids, bookId } = await readBody(event); // 从请求体获取 ID

  if (!ids || !bookId) {
    return error("Not Find ID");
  }
  
  // 查询要删除的记录，检查是否有合并组
  const flowsToDelete = await prisma.flow.findMany({
    where: {
      id: { in: ids.map((id: any) => Number(id)) },
      bookId: String(bookId),
    },
    select: {
      id: true,
      groupId: true,
    },
  });
  
  // 获取所有相关的groupId
  const affectedGroupIds = [...new Set(flowsToDelete.map(f => f.groupId).filter(Boolean))];
  
  // 删除记录
  const deleted = await prisma.flow.deleteMany({
    where: {
      id: {
        in: ids.map((id: any) => Number(id)),
      },
      bookId: String(bookId),
    },
  });
  
  // 检查每个合并组是否还有剩余记录，如果没有则删除主记录
  for (const groupId of affectedGroupIds) {
    if (!groupId) continue;
    
    const remainingFlows = await prisma.flow.findMany({
      where: {
        groupId: groupId,
        bookId: String(bookId),
      },
      take: 1,
    });
    
    if (remainingFlows.length === 0) {
      try {
        await prisma.flowGroupMain.deleteMany({
          where: { groupId: groupId },
        });
      } catch (e: any) {
        // 如果主记录不存在或 Prisma Client 未更新，忽略错误
        if (e?.message?.includes('flowGroupMain')) {
          console.log("删除主记录失败，可能 Prisma Client 未更新，请运行: npx prisma generate");
        } else {
          console.log("主记录可能不存在，忽略删除错误:", e);
        }
      }
    }
  }
  
  return success(deleted);
});
