import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { jwt } from "zod";
import authRouter from "../../routes/authRouter.js";
import { createUserRecord, getUserRecordById, getUserRecordByUsername } from "../../models/userModel.js";
import type { User } from "../../generated/prisma/index.js";
import "../../config/passportConfig.js";

const app = express();

app.use(express.json());

app.use("/auth", authRouter);

interface ResponseError {
  errors: { message: string }[];
}

interface ResponseSuccess {
  token: string;
  user: User;
}

describe("authRouter test", () => {
  describe("create user POST /auth/sign-up", () => {
    describe("given invalid inputs", () => {
      it("should return 400 status and error messages", async () => {
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
    });

    describe("given username already exists", () => {
      it("should return 409 status and error message", async () => {
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
    });

    describe("given valid inputs", () => {
      it("should return 201 status, JWT token and user object", async () => {
        expect.hasAssertions();

        const response = await request(app)
          .post("/auth/sign-up")
          .type("json")
          .send({ username: "bodi", password: "12345", confirmPassword: "12345" })
          .expect("Content-type", /json/)
          .expect(201);

        const typedResponseBody = response.body as ResponseSuccess;

        const isTokenValidJwt = jwt().safeParse(typedResponseBody.token).success;
        const createdUser = await getUserRecordById(typedResponseBody.user.id);

        if (!createdUser) {
          throw new Error("No user found");
        }

        expect(isTokenValidJwt).toBe(true);
        expect(typedResponseBody.user.id).toBe(createdUser.id);
        expect(typedResponseBody.user.username).toBe("bodi");
        expect(typedResponseBody.user.imageUrl).toBeNull();
        expect(typedResponseBody.user.isGuest).toBe(false);
      });
    });
  });

  describe("authenticate user POST /auth/log-in", () => {
    describe("given invalid inputs", () => {
      it("should return 400 status and error messages", async () => {
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
    });

    describe("given valid inputs but invalid credentials", () => {
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
    });

    describe("given valid inputs and credentials", () => {
      it("should return 200 status, JWT, and user object", async () => {
        expect.hasAssertions();

        const existingUser = await createUserRecord("bodi", "12345");

        const response = await request(app)
          .post("/auth/log-in")
          .type("json")
          .send({ username: "bodi", password: "12345" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as ResponseSuccess;

        const isTokenValidJwt = jwt().safeParse(typedResponseBody.token).success;

        expect(isTokenValidJwt).toBe(true);
        expect(typedResponseBody.user.id).toBe(existingUser.id);
        expect(typedResponseBody.user.isGuest).toBe(false);
        expect(typedResponseBody.user.username).toBe("bodi");
        expect(typedResponseBody.user.imageUrl).toBeNull();
      });
    });
  });

  describe("log in as guest GET /auth/guest", () => {
    describe("given request to login as guest", () => {
      it("should return 200 status and return guest user object with JWT", async () => {
        expect.hasAssertions();

        const response = await request(app).get("/auth/guest").expect("Content-type", /json/).expect(200);

        const typedResponseBody = response.body as ResponseSuccess;

        const guestUser = await getUserRecordByUsername("guest-user");

        if (!guestUser) {
          throw new Error("Guest user record not found");
        }

        const isTokenValidJwt = jwt().safeParse(typedResponseBody.token).success;

        expect(isTokenValidJwt).toBe(true);
        expect(typedResponseBody.user.id).toBe(guestUser.id);
        expect(typedResponseBody.user.isGuest).toBe(true);
        expect(typedResponseBody.user.username).toBe("guest-user");
        expect(typedResponseBody.user.imageUrl).toBeNull();
      });
    });
  });
});
