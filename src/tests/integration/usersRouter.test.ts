import { describe, expect, it, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import usersRouter from "../../routes/usersRouter.js";
import issueJwt from "../../lib/issueJwt.js";
import type { Message, User } from "../../generated/prisma/index.js";
import * as userModel from "../../models/userModel.js";
import * as friendshipModel from "../../models/friendshipModel.js";
import * as messageModel from "../../models/messageModel.js";
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

  describe("get current user's messages with another user GET /users/:id/messages", () => {
    describe("given invalid user id as param", () => {
      it("should return 200 status with empty messages array", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        await messageModel.sendMessageFromUserToUser(userB.id, userA.id, {
          content: "Hello from userB to userA",
          imageUrl: null,
        });

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .get("/users/invalidParam/messages")
          .auth(userAToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as { messages: Message[] };

        expect(typedResponseBody.messages).toHaveLength(0);
      });
    });

    describe("given valid user id as param", () => {
      it("should return 200 status with messages array", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        await messageModel.sendMessageFromUserToUser(userB.id, userA.id, {
          content: "Hello from userB to userA",
          imageUrl: null,
        });

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .get(`/users/${userB.id}/messages`)
          .auth(userAToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as { messages: Message[] };

        expect(typedResponseBody.messages).toStrictEqual([
          {
            id: expect.any(String) as string,
            imageUrl: null,
            content: "Hello from userB to userA",
            createdAt: expect.any(String) as string,
            senderId: userB.id,
            receiverId: userA.id,
            groupChatId: null,
          },
        ]);
      });

      it("should return the exact array regardless of which user is making the request", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        await messageModel.sendMessageFromUserToUser(userB.id, userA.id, {
          content: "Hello from userB to userA",
          imageUrl: null,
        });

        const userAToken = issueJwt(userA.id, "10m");
        const userBToken = issueJwt(userB.id, "10m");

        const response1 = await request(app)
          .get(`/users/${userB.id}/messages`)
          .auth(userAToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody1 = response1.body as { messages: Message[] };

        const response2 = await request(app)
          .get(`/users/${userA.id}/messages`)
          .auth(userBToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody2 = response2.body as { messages: Message[] };

        expect(typedResponseBody1.messages).toStrictEqual(typedResponseBody2.messages);
      });
    });
  });

  describe("create message POST /users/:id/messages", () => {
    describe("given not existing user id as param", () => {
      it.todo("should return 404 status with messages", async () => {});
    });
  });
});
