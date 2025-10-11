import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import usersRouter from "../../routes/usersRouter.js";
import issueJwt from "../../lib/issueJwt.js";
import * as userModel from "../../models/userModel.js";
import "../../config/passportConfig.js";

const app = express();

app.use(express.json());

app.use("/users", usersRouter);

describe("usersRouter routes", () => {
  describe("all requests for /users path", () => {
    describe("given no JWT", () => {
      it("should return 401 status", async () => {
        expect.hasAssertions();

        const response = await request(app).get("/users").expect(401);

        expect(response.unauthorized).toBe(true);
      });
    });

    describe("given valid JWT", () => {
      it("should not return 401 status", async () => {
        expect.hasAssertions();

        const createdUser = await userModel.createUserRecord("bodi", "12345");

        const token = issueJwt(createdUser.id, "10m");

        const response = await request(app).get("/users").auth(token, { type: "bearer" });

        expect(response.unauthorized).toBe(false);
      });
    });
  });

  describe("get authenticated in user's friends GET /users/me/friends", () => {
    describe("given GET request with valid JWT", () => {
      it.todo("should return 200 status with user's friends", async () => {
        expect.hasAssertions();

        const johnUser = await userModel.createUserRecord("john", "12345");
        const clareUser = await userModel.createUserRecord("clare", "12345");
        const bodiUser = await userModel.createUserRecord("bodi", "12345");
      });
    });
  });
});
