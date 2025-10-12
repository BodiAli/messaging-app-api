import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import friendshipsRouter from "../../routes/friendshipsRouter.js";
import issueJwt from "../../lib/issueJwt.js";
import * as userModel from "../../models/userModel.js";
import "../../config/passportConfig.js";

const app = express();

app.use(express.json());

app.use("/friendships", friendshipsRouter);

interface ResponseError {
  errors: { message: string }[];
}

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
    describe("given john sent a friend request to bodi", () => {
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
            senderId: johnUser.id,
            receiverId: bodiUser.id,
          })
          .expect("Content-type", /json/)
          .expect(201);

        const typedResponseBody = johnResponse.body as { message: string };

        expect(typedResponseBody.message).toBe("Friend request sent to bodi");

        const bodiResponse = await request(app)
          .post("/friendships")
          .auth(bodiToken, { type: "bearer" })
          .type("json")
          .send({
            senderId: bodiUser.id,
            receiverId: johnUser.id,
          })
          .expect("Content-type", /json/)
          .expect(409);
      });
    });
  });
});
