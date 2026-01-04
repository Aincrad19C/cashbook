import prisma from "~/lib/prisma";

/**
 * @swagger
 * /api/entry/flow/del:
 *   post:
 *     summary: 删除流水记录
 *     tags: ["Flow"]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             id: number 流水ID
 *             bookId: string 账本ID
 *             isGroupMain: boolean 是否是主记录（可选）
 *             groupId: string 合并组ID（可选，如果是主记录删除需要提供）
 *     responses:
 *       200:
 *         description: 流水记录删除成功
 *         content:
 *           application/json:
 *             schema:
 *               Result:
 *                 d: Flow 删除的流水记录信息
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
  const { id, bookId, isGroupMain, groupId } = await readBody(event); // 从请求体获取 ID

  if (!id || !bookId) {
    return error("Not Find ID");
  }
  
  // 如果是主记录删除，删除整个合并组
  if (isGroupMain === true && groupId) {
    // 删除所有子记录
    const deletedCount = await prisma.flow.deleteMany({
      where: {
        groupId: groupId,
        bookId,
      },
    });
    
    // 删除主记录
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
    
    return success({ 
      deleted: true, 
      groupDeleted: true,
      count: deletedCount.count 
    });
  }
  
  // 普通删除（子记录或独立记录）
  const flow = await prisma.flow.findUnique({
    where: { id, bookId },
  });
  
  if (!flow) {
    return error("记录不存在");
  }
  
  // 删除记录
  const deleted = await prisma.flow.delete({
    where: { id, bookId },
  });
  
  // 如果删除后合并组没有记录了，删除主记录
  if (flow.groupId) {
    const remainingFlows = await prisma.flow.findMany({
      where: {
        groupId: flow.groupId,
        bookId,
      },
      take: 1,
    });
    
    if (remainingFlows.length === 0) {
      try {
        await prisma.flowGroupMain.deleteMany({
          where: { groupId: flow.groupId },
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
