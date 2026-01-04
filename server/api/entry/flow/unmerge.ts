import prisma from "~/lib/prisma";

/**
 * @swagger
 * /api/entry/flow/unmerge:
 *   post:
 *     summary: 取消合并，将合并组中的记录恢复为独立记录
 *     tags: ["Flow"]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             bookId: string 账本ID
 *             groupId: string 合并组ID（可选，如果提供则取消整个组的合并）
 *             ids: number[] 要取消合并的流水ID数组（可选，如果提供则只取消指定记录的合并）
 *     responses:
 *       200:
 *         description: 取消合并成功
 *         content:
 *           application/json:
 *             schema:
 *               Result:
 *                 d: { count: number } 取消合并的记录数
 *       400:
 *         description: 取消合并失败
 *         content:
 *           application/json:
 *             schema:
 *               Error: {
 *                 message: string
 *               }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { groupId, ids, bookId } = body;

  if (!bookId) {
    return error("请先选择账本");
  }

  let where: any = { bookId };

  if (groupId) {
    // 取消整个组的合并
    where.groupId = groupId;
  } else if (Array.isArray(ids) && ids.length > 0) {
    // 取消指定记录的合并
    where.id = { in: ids.map((id: any) => Number(id)) };
    where.groupId = { not: null };
  } else {
    return error("请提供groupId或ids参数");
  }

  // 清除groupId，恢复为独立记录
  const result = await prisma.flow.updateMany({
    where,
    data: {
      groupId: null,
    },
  });

  // 如果取消整个组的合并，删除主记录
  if (groupId) {
    try {
      await prisma.flowGroupMain.deleteMany({
        where: { groupId },
      });
    } catch (e: any) {
      // 如果 flowGroupMain 不存在，说明 Prisma Client 未更新，但不影响正常流程
      if (e?.message?.includes('flowGroupMain')) {
        console.log("删除主记录失败，可能 Prisma Client 未更新，请运行: npx prisma generate");
      } else {
        console.log("删除主记录失败:", e);
      }
    }
  } else if (Array.isArray(ids) && ids.length > 0) {
    // 如果只取消部分记录的合并，需要找到这些记录所属的groupId
    const flowsToUnmerge = await prisma.flow.findMany({
      where: {
        id: { in: ids.map((id: any) => Number(id)) },
        bookId,
        groupId: { not: null },
      },
      select: {
        groupId: true,
      },
    });
    
    // 获取所有相关的groupId
    const affectedGroupIds = [...new Set(flowsToUnmerge.map(f => f.groupId).filter(Boolean))];
    
    // 检查每个组是否还有剩余记录
    for (const gId of affectedGroupIds) {
      const remainingFlows = await prisma.flow.findMany({
        where: {
          bookId,
          groupId: gId,
        },
        take: 1,
      });
      
      // 如果没有剩余记录，删除主记录
      if (remainingFlows.length === 0) {
        try {
          await prisma.flowGroupMain.deleteMany({
            where: { groupId: gId },
          });
        } catch (e: any) {
          // 如果 flowGroupMain 不存在，说明 Prisma Client 未更新，但不影响正常流程
          if (e?.message?.includes('flowGroupMain')) {
            console.log("删除主记录失败，可能 Prisma Client 未更新，请运行: npx prisma generate");
          } else {
            console.log("删除主记录失败:", e);
          }
        }
      }
    }
  }

  return success({
    count: result.count,
  });
});

