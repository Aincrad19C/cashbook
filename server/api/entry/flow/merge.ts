import prisma from "~/lib/prisma";
import { randomUUID } from "crypto";

/**
 * @swagger
 * /api/entry/flow/merge:
 *   post:
 *     summary: 合并多条流水记录为单条记录
 *     tags: ["Flow"]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             bookId: string 账本ID
 *             ids: number[] 要合并的流水ID数组（至少2条）
 *     responses:
 *       200:
 *         description: 合并成功
 *         content:
 *           application/json:
 *             schema:
 *               Result:
 *                 d: { groupId: string, count: number } 合并组ID和合并的记录数
 *       400:
 *         description: 合并失败
 *         content:
 *           application/json:
 *             schema:
 *               Error: {
 *                 message: string
 *               }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { ids, bookId } = body;

  if (!bookId) {
    return error("请先选择账本");
  }

  if (!Array.isArray(ids) || ids.length < 2) {
    return error("至少需要选择2条记录才能合并");
  }

  // 验证所有记录都属于同一个账本
  const flows = await prisma.flow.findMany({
    where: {
      id: { in: ids.map((id: any) => Number(id)) },
      bookId,
    },
  });

  if (flows.length !== ids.length) {
    return error("部分记录不存在或不属于当前账本");
  }

  // 检查是否已经有记录属于其他合并组
  const existingGroups = flows
    .map((f) => f.groupId)
    .filter((g) => g !== null && g !== undefined);
  if (existingGroups.length > 0) {
    // 如果所有记录都属于同一个组，则不需要合并
    const uniqueGroups = [...new Set(existingGroups)];
    if (uniqueGroups.length === 1) {
      return error("这些记录已经属于同一个合并组");
    }
    // 如果有记录属于不同的组，需要先取消合并
    return error("部分记录已属于其他合并组，请先取消合并");
  }

  // 生成新的合并组ID
  const groupId = randomUUID();

  // 更新所有记录，设置相同的groupId
  const result = await prisma.flow.updateMany({
    where: {
      id: { in: ids.map((id: any) => Number(id)) },
      bookId,
    },
    data: {
      groupId,
    },
  });

  return success({
    groupId,
    count: result.count,
  });
});

