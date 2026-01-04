import prisma from "~/lib/prisma";

/**
 * @swagger
 * /api/entry/flow/page:
 *   post:
 *     summary: 分页获取流水记录列表
 *     tags: ["Flow"]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             bookId: string 账本ID
 *             id: number 流水ID（可选）
 *             flowType: string 流水类型（可选）
 *             industryType: string 行业分类（可选）
 *             payType: string 支付方式（可选）
 *             startDay: string 开始日期（可选）
 *             endDay: string 结束日期（可选）
 *             name: string 流水名称（可选，支持模糊查询）
 *             attribution: string 归属（可选，支持模糊查询）
 *             description: string 描述（可选，支持模糊查询）
 *             pageNum: number 页码（默认为1）
 *             pageSize: number 每页大小（默认为15，-1表示查询全部）
 *             moneySort: string 金额排序（asc/desc）
 *             daySort: string 日期排序（asc/desc）
 *             minMoney: number 最小金额（可选）
 *             maxMoney: number 最大金额（可选）
 *     responses:
 *       200:
 *         description: 分页数据获取成功
 *         content:
 *           application/json:
 *             schema:
 *               Result:
 *                 d: PagePack<Flow> 流水分页数据
 *       400:
 *         description: 获取失败
 *         content:
 *           application/json:
 *             schema:
 *               Error: {
 *                 message: "请先选择账本"
 *               }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event); // 获取查询参数

  if (!body.bookId) {
    return error("请先选择账本");
  }

  const where: any = {
    bookId: {
      equals: body.bookId,
    },
  }; // 条件查询

  // 普通查询条件
  if (body.id) {
    // equals 等于查询
    // contains 模糊查询（pgsql和mongo中，可以增加额外参数限制忽略大小写 mode: 'insensitive'）
    where.id = {
      equals: Number(body.id),
    };
  }
  if (body.flowType) {
    where.flowType = {
      equals: body.flowType,
    };
  }
  if (body.industryType) {
    where.industryType = {
      equals: body.industryType,
    };
  }
  if (body.payType) {
    where.payType = {
      equals: body.payType,
    };
  }
  if (body.startDay && body.endDay) {
    where.day = {
      gte: body.startDay,
      lte: body.endDay,
    };
  } else if (body.startDay) {
    where.day = {
      gte: body.startDay,
    };
  } else if (body.endDay) {
    where.day = {
      lte: body.endDay,
    };
  }
  if (body.name) {
    where.name = {
      contains: body.name,
    };
  }
  if (body.attribution) {
    where.attribution = {
      contains: body.attribution,
    };
  }
  if (body.description) {
    where.description = {
      contains: body.description,
    };
  }

  // 金额范围过滤
  if (
    body.minMoney !== undefined &&
    body.minMoney !== null &&
    body.minMoney !== ""
  ) {
    const min = Number(body.minMoney);
    if (!Number.isNaN(min)) {
      where.money = { ...(where.money || {}), gte: min };
    }
  }
  if (
    body.maxMoney !== undefined &&
    body.maxMoney !== null &&
    body.maxMoney !== ""
  ) {
    const max = Number(body.maxMoney);
    if (!Number.isNaN(max)) {
      where.money = { ...(where.money || {}), lte: max };
    }
  }

  // 分页条件
  const pageNum = Number(body.pageNum ? body.pageNum : 1);
  const pageSize = Number(body.pageSize ? body.pageSize : 15);
  const skip = (pageNum - 1) * pageSize; // 计算跳过的条目数

  // 排序条件
  const orderBy: any = [];
  
  // 优先处理用户指定的排序
  if (body.moneySort) {
    // 金额排序
    orderBy.push({ money: String(body.moneySort) });
  } else if (body.daySort) {
    // 日期排序
    orderBy.push({ day: String(body.daySort) });
  } else {
    // 默认排序：日期降序
    orderBy.push({ day: "desc" });
  }
  
  // 添加ID排序确保排序稳定性
  orderBy.push({ id: "desc" });
  
  // 先查询所有符合条件的记录（用于统计和分组）
  const allFlows = await prisma.flow.findMany({ where, orderBy });
  
  // 处理合并组：合并组只算1条记录
  // 按groupId分组，每个组只取第一条记录（按原始排序）
  const groupMap = new Map<string, any>();
  const displayFlows: any[] = [];
  
  allFlows.forEach((flow) => {
    if (flow.groupId) {
      // 如果是合并组，只保留第一条记录（主记录）
      if (!groupMap.has(flow.groupId)) {
        groupMap.set(flow.groupId, flow);
        displayFlows.push(flow);
      }
    } else {
      // 独立记录直接添加
      displayFlows.push(flow);
    }
  });
  
  // 显示记录数（合并组算1条）
  const displayCount = displayFlows.length;
  
  // 根据显示记录数进行分页
  let flows: any[];
  if (pageSize == -1) {
    // 查询全部，返回所有记录（包括合并组的所有子记录）
    flows = allFlows;
  } else {
    // 对显示记录进行分页（合并组只算1条）
    const paginatedDisplayFlows = displayFlows.slice(skip, skip + pageSize);
    
    // 获取分页后的记录对应的所有子记录
    const paginatedGroupIds = new Set<string>();
    const paginatedFlowIds = new Set<number>();
    
    paginatedDisplayFlows.forEach((flow) => {
      if (flow.groupId) {
        paginatedGroupIds.add(flow.groupId);
      } else {
        paginatedFlowIds.add(flow.id);
      }
    });
    
    // 返回分页后的所有记录（包括合并组的所有子记录）
    flows = allFlows.filter((flow) => {
      if (flow.groupId) {
        return paginatedGroupIds.has(flow.groupId);
      } else {
        return paginatedFlowIds.has(flow.id);
      }
    });
  }
  
  // 计算总页数（使用显示记录数）
  const totalFlows = displayCount;
  const totalPages = pageSize == -1 ? 1 : Math.ceil(totalFlows / pageSize);
  
  // 统计逻辑：合并记录只统计主记录，不重复统计子记录
  // 1. 获取所有符合条件的记录（包括合并组的子记录）
  // 2. 对于合并组，只统计主记录（FlowGroupMain）
  // 3. 对于独立记录，正常统计
  
  // 获取所有符合条件的合并组的主记录
  const allGroupIds = [...new Set(allFlows.filter(f => f.groupId).map(f => f.groupId!))];
  let allGroupMains: any[] = [];
  
  if (allGroupIds.length > 0) {
    try {
      // 构建主记录的查询条件（需要匹配bookId和可能的其他条件）
      const mainWhere: any = {
        groupId: { in: allGroupIds },
        bookId: body.bookId,
      };
      
      // 如果查询条件中有日期范围，需要检查合并组是否在范围内
      // 由于主记录没有day字段，我们需要通过子记录来判断
      // 这里先获取所有主记录，然后通过子记录过滤
      allGroupMains = await prisma.flowGroupMain.findMany({
        where: mainWhere,
      });
      
      // 如果查询条件中有日期范围，需要过滤掉不在范围内的合并组
      if (body.startDay || body.endDay) {
        const validGroupIds = new Set<string>();
        allFlows.forEach((flow) => {
          if (flow.groupId) {
            // 检查日期是否在范围内
            let inRange = true;
            if (body.startDay && flow.day < body.startDay) {
              inRange = false;
            }
            if (body.endDay && flow.day > body.endDay) {
              inRange = false;
            }
            if (inRange) {
              validGroupIds.add(flow.groupId);
            }
          }
        });
        allGroupMains = allGroupMains.filter(m => validGroupIds.has(m.groupId));
      }
    } catch (e: any) {
      console.log("获取主记录数据失败:", e);
    }
  }
  
  // 统计独立记录（不包含合并组的记录）
  const independentFlows = allFlows.filter(f => !f.groupId);
  
  // 统计独立记录的收入、支出、不计收支
  let totalIn = 0;
  let totalOut = 0;
  let notInOut = 0;
  
  // 统计独立记录
  independentFlows.forEach((flow) => {
    const money = Number(flow.money) || 0;
    if (flow.flowType === "收入") {
      totalIn += money;
    } else if (flow.flowType === "支出") {
      totalOut += money;
    } else if (flow.flowType === "不计收支") {
      notInOut += money;
    }
  });
  
  // 统计合并组的主记录
  allGroupMains.forEach((main) => {
    const money = Number(main.money) || 0;
    if (main.flowType === "收入") {
      totalIn += money;
    } else if (main.flowType === "支出") {
      totalOut += money;
    } else if (main.flowType === "不计收支") {
      notInOut += money;
    }
  });

  // 获取所有合并组的主记录数据
  const groupIds = [...new Set(flows.filter(f => f.groupId).map(f => f.groupId!))];
  let groupMains: any[] = [];
  
  if (groupIds.length > 0) {
    try {
      groupMains = await prisma.flowGroupMain.findMany({
        where: { groupId: { in: groupIds } },
      });
    } catch (e: any) {
      // 如果 flowGroupMain 不存在，说明 Prisma Client 未更新，但不影响正常流程
      if (e?.message?.includes('flowGroupMain')) {
        console.log("获取主记录数据失败，可能 Prisma Client 未更新，请运行: npx prisma generate");
      } else {
        console.log("获取主记录数据失败:", e);
      }
    }
  }
  
  // 将主记录数据添加到flows中（作为扩展字段）
  const flowsWithMain = flows.map(flow => {
    if (flow.groupId) {
      const main = groupMains.find(m => m.groupId === flow.groupId);
      if (main) {
        return {
          ...flow,
          groupMain: main, // 添加主记录数据
        };
      }
    }
    return flow;
  });

  return success({
    total: totalFlows,
    data: flowsWithMain,
    pages: totalPages,
    totalIn,
    totalOut,
    notInOut,
  });
});
