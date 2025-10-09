import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { jwt } from "zod";
import bcrypt from "bcrypt";
import authRouter from "../routes/authRouter.js";
import {
  createUserRecord,
  getOrCreateUserRecord,
  getUserRecordById,
  getUserRecordByIdUnsafe,
  getUserRecordByUsername,
} from "../models/userModel.js";
import type { User } from "../generated/prisma/index.js";
import "../config/passportConfig.js";

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

        typedResponseBody.user.lastSeen = new Date(typedResponseBody.user.lastSeen);

        const isTokenValidJwt = jwt().safeParse(typedResponseBody.token).success;
        const createdUser = await getUserRecordById(typedResponseBody.user.id);

        if (!createdUser) {
          throw new Error("No user found");
        }

        expect(isTokenValidJwt).toBe(true);
        expect(typedResponseBody.user).toStrictEqual(createdUser);
      });

      it("should hash password when creating user record", async () => {
        expect.hasAssertions();

        const response = await request(app)
          .post("/auth/sign-up")
          .type("json")
          .send({ username: "bodi", password: "12345", confirmPassword: "12345" })
          .expect("Content-type", /json/)
          .expect(201);

        const typedResponseBody = response.body as ResponseSuccess;

        const createdUser = await getUserRecordByIdUnsafe(typedResponseBody.user.id);

        if (!createdUser) {
          throw new Error("User not found");
        }

        const doesPasswordMatch = await bcrypt.compare("12345", createdUser.password);

        expect(createdUser.password).not.toBe("12345");
        expect(doesPasswordMatch).toBe(true);
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
      it("should return 200 status, JWT, and user when credentials are valid", async () => {
        expect.hasAssertions();

        const hashedPassword = await bcrypt.hash("12345", 10);
        const existingUser = await createUserRecord("bodi", hashedPassword);

        const response = await request(app)
          .post("/auth/log-in")
          .type("json")
          .send({ username: "bodi", password: "12345" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as ResponseSuccess;

        typedResponseBody.user.lastSeen = new Date(typedResponseBody.user.lastSeen);

        const isTokenValidJwt = jwt().safeParse(typedResponseBody.token).success;

        expect(isTokenValidJwt).toBe(true);
        expect(typedResponseBody.user.isGuest).toBe(false);
        expect(typedResponseBody.user).toStrictEqual(existingUser);
      });
    });
  });

  describe("log in as guest GET /auth/guest", () => {
    describe("given guest record not found inside User model", () => {
      it("should return 200 status, create a guest record and return it with JWT", async () => {
        expect.hasAssertions();

        const guestUser = await getUserRecordByUsername("guest-user");

        expect(guestUser).toBeNull();

        const response = await request(app).get("/auth/guest").expect("Content-type", /json/).expect(200);

        const typedResponseBody = response.body as ResponseSuccess;

        typedResponseBody.user.lastSeen = new Date(typedResponseBody.user.lastSeen);

        const createdGuestUser = await getUserRecordByUsername("guest-user");

        if (!createdGuestUser) {
          throw new Error("Guest user record not found");
        }

        const { password: _password, ...createdGuestUserWithoutPassword } = createdGuestUser;

        const isTokenValidJwt = jwt().safeParse(typedResponseBody.token).success;

        expect(isTokenValidJwt).toBe(true);
        expect(createdGuestUser.isGuest).toBe(true);
        expect(typedResponseBody.user).toStrictEqual(createdGuestUserWithoutPassword);
      });
    });

    describe("given an already existing guest record inside User model", () => {
      it("should return 200 status and return it with JWT", async () => {
        expect.hasAssertions();

        const existingGuestUser = await getOrCreateUserRecord("guest-user", "guest password");

        const response = await request(app).get("/auth/guest").expect("Content-type", /json/).expect(200);

        const typedResponseBody = response.body as ResponseSuccess;
        typedResponseBody.user.lastSeen = new Date(typedResponseBody.user.lastSeen);

        const isTokenValidJwt = jwt().safeParse(typedResponseBody.token).success;

        expect(isTokenValidJwt).toBe(true);
        expect(typedResponseBody.user.isGuest).toBe(true);
        expect(typedResponseBody.user).toStrictEqual(existingGuestUser);
      });
    });
  });
});
