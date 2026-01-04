import prisma from "~/lib/prisma";
import { initTypeRelation } from "../utils/data";

export default defineNitroPlugin((nitroApp) => {
  // 只执行一次的Hook，初始化数据库
  nitroApp.hooks.hookOnce("request", async () => {
    // 初始化系统设置
    const nums = await prisma.systemSetting.count();
    if (nums < 1) {
      await prisma.systemSetting.create({
        data: {
          id: 1,
          title: "青葱记账",
          description: "青葱记账",
          keywords: "青葱记账",
        },
      });
      console.log("Init System Settings");
    } else {
      // 如果已存在配置，检查并更新旧的 Cashbook 名称
      const existing = await prisma.systemSetting.findUnique({
        where: { id: 1 },
      });
      if (existing && (existing.title === "Cashbook" || existing.title === "cashbook")) {
        await prisma.systemSetting.update({
          data: {
            title: "青葱记账",
            description: existing.description === "Cashbook" ? "青葱记账" : existing.description,
            keywords: existing.keywords === "Cashbook" ? "青葱记账" : existing.keywords,
          },
          where: { id: 1 },
        });
        console.log("Updated System Settings: Cashbook -> 青葱记账");
      }
    }
    await prisma.systemSetting.update({
      data: { version: String(useRuntimeConfig().appVersion) },
      where: {
        id: 1,
      },
    });
    // 保证eliminate字段有值，防止业务出错
    await prisma.$executeRaw`UPDATE "Flow" SET "eliminate" = 0 WHERE "eliminate" is null;`;
    initTypeRelation();
  });
});
