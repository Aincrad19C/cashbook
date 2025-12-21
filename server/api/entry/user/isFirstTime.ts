import prisma from "~/lib/prisma";

/**
 * @swagger
 * /api/entry/user/isFirstTime:
 *   get:
 *     summary: 检查用户是否是首次登录（是否有流水记录）
 *     tags: ["User"]
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: 检查成功
 *         content:
 *           application/json:
 *             schema:
 *               Result:
 *                 d: boolean true表示首次登录，false表示已有流水记录
 */
export default defineEventHandler(async (event) => {
  const userId = await getUserId(event);
  const query = getQuery(event);
  const bookId = (query.bookId as string) || null;

  if (!bookId) {
    return success(true); // 如果没有 bookId，默认认为是首次登录
  }

  // 检查用户是否有流水记录
  const flowCount = await prisma.flow.count({
    where: {
      userId,
      bookId,
    },
  });

  // 如果没有流水记录，认为是首次登录
  return success(flowCount === 0);
});

