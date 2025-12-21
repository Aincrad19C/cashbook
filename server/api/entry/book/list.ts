import prisma from "~/lib/prisma";
import { getUUID } from "~/utils/common";

/**
 * @swagger
 * /api/entry/book/list:
 *   post:
 *     summary: 获取账本列表（如果用户没有账本，自动创建默认账本）
 *     tags: ["Book"]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             id: number 账本ID（可选）
 *             bookName: string 账本名称（可选，支持模糊查询）
 *     responses:
 *       200:
 *         description: 账本列表获取成功
 *         content:
 *           application/json:
 *             schema:
 *               Result:
 *                 d: [] #[Book账本列表数组]
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event); // 获取查询参数
  const userId = await getUserId(event);

  const where: any = {
    userId,
  }; // 条件查询

  // 添加条件：如果 `name` 存在，则根据 `name` 查询
  if (body.id) {
    // equals 等于查询
    // contains 模糊查询（pgsql和mongo中，可以增加额外参数限制忽略大小写 mode: 'insensitive'）
    where.id = {
      equals: Number(body.id),
    };
  }

  // 如果 `email` 存在，则根据 `email` 查询
  if (body.bookName) {
    where.bookName = {
      contains: String(body.bookName),
    };
  }

  let books = await prisma.book.findMany({
    where, // 使用条件查询
    orderBy: {
      createDate: "asc", // 按创建时间升序，最早的作为默认账本
    },
  });

  // 如果用户没有账本，自动创建一个默认账本
  if (books.length === 0 && !body.id && !body.bookName) {
    const bookId = userId + "-" + getUUID(8);
    const defaultBookName = "我的账本";
    
    // 创建默认账本
    const created = await prisma.book.create({
      data: {
        bookId,
        userId,
        bookName: defaultBookName,
        budget: 0,
      },
    });

    // 初始化 book 的 TypeRelation 数据
    const dTypes = await prisma.typeRelation.findMany({
      where: {
        bookId: "0",
        userId: 0,
      },
    });

    if (dTypes.length > 0) {
      const newTypes: any = [];
      dTypes.forEach((t) => {
        newTypes.push({
          bookId,
          userId,
          source: t.source,
          target: t.target,
        });
      });
      await prisma.typeRelation.createMany({
        data: newTypes,
      });
    }

    // 返回新创建的账本
    books = [created];
  } else if (books.length > 0 && !body.id && !body.bookName) {
    // 如果用户有多个账本，只返回第一个（默认账本）
    // 这样可以确保前端始终使用同一个账本
    books = [books[0]];
  }

  return success(books);
});
