import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";

export type AuthPayload = {
  sub: string;
  role: string;
};

/**
 * Verify access token from Authorization header
 * Throws typed errors for route handlers to catch
 */
export function verifyAccessToken(req: Request): AuthPayload {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("TOKEN_MISSING");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as any;

    return {
      sub: payload.sub,
      role: payload.role,
    };
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new Error("TOKEN_EXPIRED");
    }

    if (err instanceof JsonWebTokenError) {
      throw new Error("TOKEN_INVALID");
    }

    throw new Error("TOKEN_ERROR");
  }
}
