import jwt from "jsonwebtoken";

export type AuthPayload = {
  sub: string;
  role: string;
};

export function getUserFromToken(req: Request): AuthPayload {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
console.log(
    "PROFILE API - ACCESS SECRET LENGTH",
    process.env.JWT_ACCESS_SECRET?.length
  );
  const token = authHeader.split(" ")[1];

  return jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET!
  ) as AuthPayload;
}
