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

  return success({
    count: result.count,
  });
});

