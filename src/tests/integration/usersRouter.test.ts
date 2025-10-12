import { describe, expect, it, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import usersRouter from "../../routes/usersRouter.js";
import issueJwt from "../../lib/issueJwt.js";
import type { User } from "../../generated/prisma/index.js";
import * as userModel from "../../models/userModel.js";
import * as friendshipModel from "../../models/friendshipModel.js";
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

  describe("get authenticated user's friends GET /users/me/friends", () => {
    describe("given GET request with valid JWT", () => {
      let johnUser: Omit<User, "password">;
      let clareUser: Omit<User, "password">;
      let bodiUser: Omit<User, "password">;

      beforeEach(async () => {
        johnUser = await userModel.createUserRecord("john", "12345");
        clareUser = await userModel.createUserRecord("clare", "12345");
        bodiUser = await userModel.createUserRecord("bodi", "12345");

        const { id: johnRequestId } = await friendshipModel.sendFriendRequest(johnUser.id, bodiUser.id);
        const { id: clareRequestId } = await friendshipModel.sendFriendRequest(clareUser.id, bodiUser.id);

        await friendshipModel.acceptFriendRequest(johnRequestId);
        await friendshipModel.acceptFriendRequest(clareRequestId);
      });

      it("should return 200 status with bodi's friends", async () => {
        expect.hasAssertions();

        const bodiToken = issueJwt(bodiUser.id, "10m");

        const bodiResponse = await request(app)
          .get("/users/me/friends")
          .auth(bodiToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedBodiResponse = bodiResponse.body as { friends: Omit<User, "password">[] };

        expect(typedBodiResponse.friends).toStrictEqual([
          expect.objectContaining({
            id: johnUser.id,
            username: "john",
          }),
          expect.objectContaining({
            id: clareUser.id,
            username: "clare",
          }),
        ]);
      });

      it("should return 200 status with john's friends", async () => {
        expect.hasAssertions();

        const johnToken = issueJwt(johnUser.id, "10m");

        const johnResponse = await request(app)
          .get("/users/me/friends")
          .auth(johnToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedJohnResponse = johnResponse.body as { friends: Omit<User, "password">[] };

        expect(typedJohnResponse.friends).toStrictEqual([
          expect.objectContaining({
            id: bodiUser.id,
            username: "bodi",
          }),
        ]);
      });

      it("should return 200 status with clare's friends", async () => {
        expect.hasAssertions();

        const clareToken = issueJwt(clareUser.id, "10m");

        const clareResponse = await request(app)
          .get("/users/me/friends")
          .auth(clareToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedClareResponse = clareResponse.body as { friends: Omit<User, "password">[] };

        expect(typedClareResponse.friends).toStrictEqual([
          expect.objectContaining({
            id: bodiUser.id,
            username: "bodi",
          }),
        ]);
      });
    });
  });
});
