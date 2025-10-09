import jwt from "jsonwebtoken";

export default function issueJwt(id: string) {
  const token = jwt.sign({ sub: id }, process.env.SECRET_KEY, {
    expiresIn: "2w",
  });

  return token;
}
