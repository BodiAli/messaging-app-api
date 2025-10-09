import express from "express";
import request from "supertest";
import authRouter from "../routes/authRouter.js";
import { describe, expect, it } from "vitest";
import { createUserRecord } from "../models/userModel.js";

const app = express();

app.use(express.json());

app.use("/auth", authRouter);

describe("authRouter test", () => {
  describe("create user", () => {
    describe("given POST request to /auth/sign-up", () => {
      it("should return 400 status when username or password are not valid", async () => {
        expect.hasAssertions();

        const response = await request(app)
          .post("/auth/sign-up")
          .type("json")
          .send({ username: "", password: "123", confirmPassword: "321" })
          .expect("Content-type", /json/)
          .expect(400);

        const typedResponseBody = response.body as { errors: { message: string }[] };

        expect(typedResponseBody.errors[0]?.message).toBe("Username cannot be empty.");
        expect(typedResponseBody.errors[1]?.message).toBe("Password must be at least 5 characters.");
        expect(typedResponseBody.errors[2]?.message).toBe("Passwords do not match.");
      });

      it("should return 409 status when username already exists", async () => {
        expect.hasAssertions();

        await createUserRecord("bodi", "12345");

        const response = await request(app)
          .post("/auth/sign-up")
          .type("json")
          .send({ username: "bodi", password: "54321", confirmPassword: "54321" })
          .expect("Content-type", /json/)
          .expect(409);

        const typedResponseBody = response.body as { errors: { message: string }[] };

        expect(typedResponseBody.errors[0]?.message).toBe("A user with this username already exists.");
      });

      it.todo("should return 200 status and return JWT token when form submission is valid", () => {
        expect.hasAssertions();
      });
    });
  });
});
