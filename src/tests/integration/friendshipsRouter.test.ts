import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import friendshipsRouter from "../../routes/friendshipsRouter.js";
import issueJwt from "../../lib/issueJwt.js";
import type ResponseError from "../../types/responseError.js";
import * as userModel from "../../models/userModel.js";
import * as friendshipModel from "../../models/friendshipModel.js";
import "../../config/passportConfig.js";

const app = express();

app.use(express.json());

app.use("/friendships", friendshipsRouter);

describe("friendshipsRouter routes", () => {
  describe("all requests for /friendships path", () => {
    describe("given no JWT or invalid JWT", () => {
      it("should return 401 status", async () => {
        expect.hasAssertions();

        const token = issueJwt("12345", "10m");

        const response1 = await request(app).get("/friendships").expect(401);
        const response2 = await request(app).get("/friendships").auth(token, { type: "bearer" }).expect(401);

        expect(response1.unauthorized).toBe(true);
        expect(response2.unauthorized).toBe(true);
      });
    });

    describe("given valid JWT", () => {
      it("should not return 401 status", async () => {
        expect.hasAssertions();

        const createdUser = await userModel.createUserRecord("bodi", "12345");

        const token = issueJwt(createdUser.id, "10m");

        const response = await request(app).get("/friendships").auth(token, { type: "bearer" });

        expect(response.unauthorized).toBe(false);
      });
    });
  });

  describe("create friend request POST /friendships", () => {
    describe("given userA sent a friend request to userB", () => {
      it("should return 409 when bodi tries to send a friend request to john", async () => {
        expect.hasAssertions();

        const bodiUser = await userModel.createUserRecord("bodi", "12345");
        const johnUser = await userModel.createUserRecord("john", "12345");

        const johnToken = issueJwt(johnUser.id, "10m");
        const bodiToken = issueJwt(bodiUser.id, "10m");

        const johnResponse = await request(app)
          .post("/friendships")
          .auth(johnToken, { type: "bearer" })
          .type("json")
          .send({
            receiverId: bodiUser.id,
          })
          .expect("Content-type", /json/)
          .expect(201);

        const typedJohnBody = johnResponse.body as { message: string };

        expect(typedJohnBody.message).toBe("Friend request sent to bodi");

        const bodiResponse = await request(app)
          .post("/friendships")
          .auth(bodiToken, { type: "bearer" })
          .type("json")
          .send({
            receiverId: johnUser.id,
          })
          .expect("Content-type", /json/)
          .expect(409);

        const typedBodiBody = bodiResponse.body as ResponseError;

        expect(typedBodiBody).toStrictEqual({
          errors: ["A friend request is already sent by john"],
        });
      });

      it("should return 201 status with message", async () => {
        expect.hasAssertions();

        const clareUser = await userModel.createUserRecord("clare", "12345");
        const johnUser = await userModel.createUserRecord("john", "12345");

        const johnToken = issueJwt(johnUser.id, "10m");

        const johnResponse = await request(app)
          .post("/friendships")
          .auth(johnToken, { type: "bearer" })
          .type("json")
          .send({
            receiverId: clareUser.id,
          })
          .expect("Content-type", /json/)
          .expect(201);

        const typedJohnBody = johnResponse.body as { message: string };

        expect(typedJohnBody.message).toBe("Friend request sent to clare");
      });
    });
  });

  describe("reject friend request DELETE /friendships/:id", () => {
    describe("given userA rejecting userB's friend request", () => {
      it("should return 404 when friend request id param is invalid", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        const userAToken = issueJwt(userA.id, "10m");

        await friendshipModel.sendFriendRequest(userB.id, userA.id);

        const response = await request(app)
          .delete("/friendships/123")
          .auth(userAToken, { type: "bearer" })
          .expect(404);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors).toStrictEqual([{ message: "No record was found for a delete." }]);
      });

      it("should return 204 status when friend request id param is valid", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        const userAToken = issueJwt(userA.id, "10m");

        const friendRequest = await friendshipModel.sendFriendRequest(userB.id, userA.id);

        const response = await request(app)
          .delete(`/friendships/${friendRequest.id}`)
          .auth(userAToken, { type: "bearer" })
          .expect(204);

        expect(response.noContent).toBe(true);
      });
    });
  });

  describe("accept friend request PATCH /friendships/:id", () => {
    describe("given userA accepting userB's friend request", () => {
      it("should return 404 when friend request id param is invalid", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        const userAToken = issueJwt(userA.id, "10m");

        await friendshipModel.sendFriendRequest(userB.id, userA.id);

        const response = await request(app)
          .patch("/friendships/123")
          .auth(userAToken, { type: "bearer" })
          .expect(404);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors).toStrictEqual([{ message: "No record was found for an update." }]);
      });

      it("should return 204 status when friend request id param is valid", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        const userAToken = issueJwt(userA.id, "10m");

        const friendRequest = await friendshipModel.sendFriendRequest(userB.id, userA.id);

        const response = await request(app)
          .patch(`/friendships/${friendRequest.id}`)
          .auth(userAToken, { type: "bearer" })
          .expect(204);

        expect(response.noContent).toBe(true);
      });
    });
  });
});
