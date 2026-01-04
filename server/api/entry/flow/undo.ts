import prisma from "~/lib/prisma";
import { getUserId } from "~/server/utils/common";

/**
 * @swagger
 * /api/entry/flow/undo:
 *   post:
 *     summary: 撤销删除操作
 *     tags: ["Flow"]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             operation: object 删除操作信息
 *             bookId: string 账本ID
 *     responses:
 *       200:
 *         description: 撤销删除成功
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { operation, bookId } = body;

  if (!operation || !bookId) {
    return error("参数不完整");
  }

  const { type, data } = operation;

  try {
    switch (type) {


      case 'delete': {
        // 撤销删除：恢复删除的记录
        if (data.isGroupMain && data.groupId) {
          // 恢复合并组的所有记录
          if (Array.isArray(data.flows)) {
            for (const flow of data.flows) {
              await prisma.flow.create({
                data: {
                  userId: flow.userId,
                  bookId: flow.bookId,
                  day: flow.day,
                  flowType: flow.flowType,
                  industryType: flow.industryType,
                  payType: flow.payType,
                  money: flow.money,
                  name: flow.name,
                  description: flow.description,
                  attribution: flow.attribution,
                  groupId: flow.groupId,
                  invoice: flow.invoice || null,
                  origin: flow.origin || null,
                  eliminate: flow.eliminate || 0,
                },
              });
            }
          }
          // 恢复主记录
          if (data.groupMain) {
            const userId = await getUserId(event);
            try {
              await prisma.flowGroupMain.create({
                data: {
                  groupId: data.groupId,
                  bookId,
                  userId,
                  flowType: data.groupMain.flowType,
                  industryType: data.groupMain.industryType,
                  payType: data.groupMain.payType,
                  money: data.groupMain.money,
                  name: data.groupMain.name,
                  description: data.groupMain.description,
                  attribution: data.groupMain.attribution,
                },
              });
            } catch (e: any) {
              // 如果已存在，更新它
              if (e.code === 'P2002') {
                await prisma.flowGroupMain.update({
                  where: { groupId: data.groupId },
                  data: {
                    flowType: data.groupMain.flowType,
                    industryType: data.groupMain.industryType,
                    payType: data.groupMain.payType,
                    money: data.groupMain.money,
                    name: data.groupMain.name,
                    description: data.groupMain.description,
                    attribution: data.groupMain.attribution,
                  },
                });
              }
            }
          }
        } else if (data.flow) {
          // 恢复单个记录
          await prisma.flow.create({
            data: {
              userId: data.flow.userId,
              bookId: data.flow.bookId,
              day: data.flow.day,
              flowType: data.flow.flowType,
              industryType: data.flow.industryType,
              payType: data.flow.payType,
              money: data.flow.money,
              name: data.flow.name,
              description: data.flow.description,
              attribution: data.flow.attribution,
              groupId: data.flow.groupId,
              invoice: data.flow.invoice || null,
              origin: data.flow.origin || null,
              eliminate: data.flow.eliminate || 0,
            },
          });
        } else if (data.flows && Array.isArray(data.flows)) {
          // 批量删除恢复
          for (const flow of data.flows) {
            await prisma.flow.create({
              data: {
                userId: flow.userId,
                bookId: flow.bookId,
                day: flow.day,
                flowType: flow.flowType,
                industryType: flow.industryType,
                payType: flow.payType,
                money: flow.money,
                name: flow.name,
                description: flow.description,
                attribution: flow.attribution,
                groupId: flow.groupId,
                invoice: flow.invoice || null,
                origin: flow.origin || null,
                eliminate: flow.eliminate || 0,
              },
            });
          }
        }
        return success({ message: '撤销删除成功' });
      }


      default:
        return error('仅支持撤销删除操作');
    }
  } catch (error: any) {
    return error(error?.message || '撤销删除失败');
  }
});

