import prisma from "~/lib/prisma";

/**
 * @swagger
 * /api/entry/flow/get:
 *   post:
 *     summary: 获取单条流水记录
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
 *     responses:
 *       200:
 *         description: 获取成功
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, bookId } = body;

  if (!id || !bookId) {
    return error("参数不完整");
  }

  const flow = await prisma.flow.findUnique({
    where: { id: Number(id), bookId: String(bookId) },
  });

  if (!flow) {
    return error("记录不存在");
  }

  return success(flow);
});

