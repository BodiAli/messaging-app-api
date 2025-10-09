import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

export default function issueJwt(id: string, expiresIn: StringValue) {
  const token = jwt.sign({ sub: id }, process.env.SECRET_KEY, {
    expiresIn,
  });

  return token;
}
