import express from "express";
import request from "supertest";
import authRouter from "../routes/authRouter.js";
import { describe, expect, it } from "vitest";
import { createUserRecord } from "../models/userModel.js";

const app = express();

app.use("/auth", authRouter);

app.use((err, req, res, next) => {
  console.log("ERROR!!!", err);
});

describe("authRouter test", () => {
  describe("authenticate requests to users", () => {
    describe("given POST request to /auth/log-in", () => {
      it("should return 400 status with validation errors", async () => {
        expect.hasAssertions();

        await createUserRecord("bodi", "12345");

        const response = await request(app)
          .post("/auth/log-in")
          .send({ username: " ", password: "1234" })
          .expect("Content-type", /json/)
          .expect(400);

        const responseBody = response.body as { errors: { msg: string }[] };

        expect(responseBody.errors[0]?.msg).toBe("Username cannot be empty");
      });
    });
  });
});
