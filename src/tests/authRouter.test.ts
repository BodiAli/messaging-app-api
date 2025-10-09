import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { jwt } from "zod";
import authRouter from "../routes/authRouter.js";
import { createUserRecord, getUserRecordById } from "../models/userModel.js";
import type { User } from "../generated/prisma/index.js";
import "../config/passportConfig.js";

const app = express();

app.use(express.json());

app.use("/auth", authRouter);

interface ResponseError {
  errors: { message: string }[];
}

describe("authRouter test", () => {
  describe("create user", () => {
    describe("given POST request to /auth/sign-up", () => {
      it("should return 400 status when inputs are not valid", async () => {
        expect.hasAssertions();

        const response = await request(app)
          .post("/auth/sign-up")
          .type("json")
          .send({ username: "", password: "123", confirmPassword: "321" })
          .expect("Content-type", /json/)
          .expect(400);

        const typedResponseBody = response.body as ResponseError;

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

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors[0]?.message).toBe("A user with this username already exists.");
      });

      it("should return 201 status and return JWT token and user when form submission is valid", async () => {
        expect.hasAssertions();

        const response = await request(app)
          .post("/auth/sign-up")
          .type("json")
          .send({ username: "bodi", password: "12345", confirmPassword: "12345" })
          .expect("Content-type", /json/)
          .expect(201);

        const typedResponseBody = response.body as { token: string; user: User };

        const isTokenValidJwt = jwt().safeParse(typedResponseBody.token).success;
        const createdUser = await getUserRecordById(typedResponseBody.user.id);

        if (!createdUser) {
          throw new Error("No user found");
        }

        expect(isTokenValidJwt).toBe(true);
        expect(createdUser.username).toBe("bodi");
      });
    });
  });

  describe("authenticate user", () => {
    describe("given POST request to /auth/log-in", () => {
      it("should return 400 status when inputs are not valid", async () => {
        expect.hasAssertions();

        const response = await request(app)
          .post("/auth/log-in")
          .type("json")
          .send({ username: "", password: "" })
          .expect("Content-type", /json/)
          .expect(400);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors[0]?.message).toBe("Username cannot be empty.");
        expect(typedResponseBody.errors[1]?.message).toBe("Password cannot be empty.");
      });

      it("should return 401 status and an error message when credentials are invalid", async () => {
        expect.hasAssertions();

        await createUserRecord("bodi", "12345");

        const response = await request(app)
          .post("/auth/log-in")
          .type("json")
          .send({ username: "bodi", password: "invalid" })
          .expect("Content-type", /json/)
          .expect(401);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors[0]?.message).toBe("Incorrect username or password.");
      });

      it.todo("should return 200 status, JWT, and user when credentials are valid", async () => {
        expect.hasAssertions();
      });
    });
  });
});
