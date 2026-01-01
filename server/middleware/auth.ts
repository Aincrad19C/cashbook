import { noPermissions } from "../utils/common";
import jwt from "jsonwebtoken";

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);

  // 校验 API 请求
  if (url.pathname.startsWith("/api/entry")) {
    const token = getHeader(event, "Authorization");

    if (!token) {
      // Token is missing, return 401 Unauthorized
      return noPermissions("No Authorization");
    }
    const secretKey = useRuntimeConfig().authSecret;

    // 验证 JWT
    try {
      jwt.verify(token, secretKey);
    } catch (err) {
      return noPermissions("Forbidden: Invalid or expired token");
    }
  }
});
