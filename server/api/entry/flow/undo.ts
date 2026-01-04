import prisma from "~/lib/prisma";
import { getUserId } from "~/server/utils/common";

/**
 * @swagger
 * /api/entry/flow/undo:
 *   post:
 *     summary: 撤销操作
 *     tags: ["Flow"]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             operation: object 操作信息
 *             bookId: string 账本ID
 *     responses:
 *       200:
 *         description: 撤销成功
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
      case 'add': {
        // 撤销添加：删除新添加的记录
        if (data.id) {
          await prisma.flow.delete({
            where: { id: data.id, bookId },
          });
        }
        return success({ message: '撤销添加成功' });
      }

      case 'update': {
        // 撤销修改：恢复修改前的数据
        if (data.id) {
          const updateData: any = {
            day: data.day,
            flowType: data.flowType,
            industryType: data.industryType,
            payType: data.payType,
            money: data.money,
            name: data.name,
            description: data.description,
            attribution: data.attribution,
          };
          await prisma.flow.update({
            where: { id: data.id, bookId },
            data: updateData,
          });
        }
        return success({ message: '撤销修改成功' });
      }

      case 'updateMain': {
        // 撤销主记录修改：恢复修改前的数据
        if (data.groupId) {
          const existingMain = await prisma.flowGroupMain.findUnique({
            where: { groupId: data.groupId },
          });

          if (existingMain) {
            await prisma.flowGroupMain.update({
              where: { groupId: data.groupId },
              data: {
                flowType: data.flowType,
                industryType: data.industryType,
                payType: data.payType,
                money: data.money,
                name: data.name,
                description: data.description,
                attribution: data.attribution,
              },
            });
          } else {
            // 如果主记录不存在，创建它
            const userId = await getUserId(event);
            await prisma.flowGroupMain.create({
              data: {
                groupId: data.groupId,
                bookId,
                userId,
                flowType: data.flowType,
                industryType: data.industryType,
                payType: data.payType,
                money: data.money,
                name: data.name,
                description: data.description,
                attribution: data.attribution,
              },
            });
          }
        }
        return success({ message: '撤销主记录修改成功' });
      }

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

      case 'merge': {
        // 撤销合并：取消合并（清除groupId）
        if (data.ids && Array.isArray(data.ids)) {
          await prisma.flow.updateMany({
            where: {
              id: { in: data.ids.map((id: any) => Number(id)) },
              bookId,
            },
            data: {
              groupId: null,
            },
          });
          // 删除主记录
          if (data.groupId) {
            try {
              await prisma.flowGroupMain.deleteMany({
                where: { groupId: data.groupId },
              });
            } catch (e: any) {
              // 忽略错误
            }
          }
        }
        return success({ message: '撤销合并成功' });
      }

      case 'unmerge': {
        // 撤销取消合并：重新合并
        if (data.groupId && data.ids && Array.isArray(data.ids)) {
          await prisma.flow.updateMany({
            where: {
              id: { in: data.ids.map((id: any) => Number(id)) },
              bookId,
            },
            data: {
              groupId: data.groupId,
            },
          });
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
        }
        return success({ message: '撤销取消合并成功' });
      }

      case 'batchUpdate': {
        // 撤销批量修改：恢复修改前的数据
        if (data.flows && Array.isArray(data.flows)) {
          for (const flow of data.flows) {
            const updateData: any = {};
            if (flow.flowType !== undefined) updateData.flowType = flow.flowType;
            if (flow.industryType !== undefined) updateData.industryType = flow.industryType;
            if (flow.payType !== undefined) updateData.payType = flow.payType;
            if (flow.attribution !== undefined) updateData.attribution = flow.attribution;
            
            if (Object.keys(updateData).length > 0) {
              await prisma.flow.update({
                where: { id: flow.id, bookId },
                data: updateData,
              });
            }
          }
        }
        return success({ message: '撤销批量修改成功' });
      }

      default:
        return error('不支持的操作类型');
    }
  } catch (error: any) {
    console.error('撤销操作失败:', error);
    return error(error?.message || '撤销操作失败');
  }
});

