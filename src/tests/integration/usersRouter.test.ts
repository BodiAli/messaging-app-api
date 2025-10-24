import { describe, expect, it, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import type { UploadStream, UploadApiOptions, UploadApiResponse, UploadResponseCallback } from "cloudinary";
import cloudinary from "../../config/cloudinaryConfig.js";
import usersRouter from "../../routes/usersRouter.js";
import issueJwt from "../../lib/issueJwt.js";
import type { Message, User } from "../../generated/prisma/index.js";
import type ResponseError from "../../types/responseError.js";
import * as userModel from "../../models/userModel.js";
import * as friendshipModel from "../../models/friendshipModel.js";
import * as messageModel from "../../models/messageModel.js";
import "../../config/passportConfig.js";

const app = express();

app.use(express.json());

app.use("/users", usersRouter);

vi.mock(import("../../config/cloudinaryConfig.js"), () => {
  return {
    default: {
      uploader: {
        upload_stream: vi.fn<(arg1?: UploadApiOptions, arg2?: UploadResponseCallback) => UploadStream>(
          (_options?: UploadApiOptions, cb?: UploadResponseCallback) => {
            return {
              end: () => {
                if (cb) {
                  cb(undefined, { secure_url: "imageUrl" } as UploadApiResponse);
                }
              },
            } as UploadStream;
          }
        ) as typeof cloudinary.uploader.upload_stream,
      },
    } as typeof cloudinary,
  };
});

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
            lastSeen: expect.any(String) as string,
          }),
          expect.objectContaining({
            id: clareUser.id,
            username: "clare",
            lastSeen: expect.any(String) as string,
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
            lastSeen: expect.any(String) as string,
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
            lastSeen: expect.any(String) as string,
          }),
        ]);
      });
    });
  });

  describe("get current user's messages with another user GET /users/:id/messages", () => {
    describe("given non-existing user id as param", () => {
      it("should return 404 status with error message", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        await messageModel.sendMessageFromUserToUser(userB.id, userA.id, {
          content: "Hello from userB to userA",
          imageUrl: null,
        });

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .get("/users/notExists/messages")
          .auth(userAToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(404);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "User not found.",
            },
          ],
        });
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
      it("should return 404 status with error message", async () => {
        expect.hasAssertions();

        const userB = await userModel.createUserRecord("userB", "12345");

        const userBToken = issueJwt(userB.id, "10m");

        const response = await request(app)
          .post("/users/notExistingId/messages")
          .auth(userBToken, { type: "bearer" })
          .type("json")
          .send({ messageContent: "Hello from userB to userA" })
          .expect("Content-type", /json/)
          .expect(404);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors).toStrictEqual([
          {
            message: "Cannot find user to send message to.",
          },
        ]);
      });
    });

    describe("given invalid message inputs", () => {
      it("should return 400 when message image is more than 5MB", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        const userBToken = issueJwt(userB.id, "10m");

        const buffer = Buffer.alloc(1024 * 1024 * 5 + 1);

        const response = await request(app)
          .post(`/users/${userA.id}/messages`)
          .auth(userBToken, { type: "bearer" })
          .attach("messageImage", buffer, { filename: "fileName", contentType: "image/png" })
          .field("messageContent", "Hello from userB to userA")
          .expect("Content-type", /json/)
          .expect(400);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors).toStrictEqual([
          expect.objectContaining({ message: "File cannot exceed 5MBs." }),
        ]);
      });

      it("should return 400 when message image is not of type image", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        const userBToken = issueJwt(userB.id, "10m");

        const buffer = Buffer.alloc(1024);

        const response = await request(app)
          .post(`/users/${userA.id}/messages`)
          .auth(userBToken, { type: "bearer" })
          .attach("messageImage", buffer, { filename: "fileName", contentType: "application/json" })
          .field("messageContent", "Hello from userB to userA")
          .expect("Content-type", /json/)
          .expect(400);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors).toStrictEqual([
          expect.objectContaining({ message: "File must be of type image." }),
        ]);
      });

      it("should return 400 when content is empty", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        const userBToken = issueJwt(userB.id, "10m");

        const buffer = Buffer.alloc(1024);

        const response = await request(app)
          .post(`/users/${userA.id}/messages`)
          .auth(userBToken, { type: "bearer" })
          .attach("messageImage", buffer, { filename: "fileName", contentType: "image/png" })
          .field("messageContent", "")
          .expect("Content-type", /json/)
          .expect(400);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors).toStrictEqual([
          expect.objectContaining({ message: "Message cannot be empty." }),
        ]);
      });
    });

    describe("given valid message inputs", () => {
      it("should successfully create message when messageImage does not exist", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        const userBToken = issueJwt(userB.id, "10m");

        const response = await request(app)
          .post(`/users/${userA.id}/messages`)
          .auth(userBToken, { type: "bearer" })
          .field("messageContent", "Hello from userB to userA")
          .expect("Content-type", /json/)
          .expect(201);

        const typedResponseBody = response.body as { message: Message };

        expect(response.ok).toBe(true);
        expect(typedResponseBody.message).toStrictEqual({
          id: expect.any(String) as string,
          content: "Hello from userB to userA",
          imageUrl: null,
          createdAt: expect.any(String) as string,
          senderId: userB.id,
          receiverId: userA.id,
          groupChatId: null,
        });
      });

      it("should return 201 status when messageContent and messageImage (if present) are valid", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        const userBToken = issueJwt(userB.id, "10m");

        const buffer = Buffer.alloc(1024);

        const response = await request(app)
          .post(`/users/${userA.id}/messages`)
          .auth(userBToken, { type: "bearer" })
          .attach("messageImage", buffer, { filename: "fileName", contentType: "image/png" })
          .field("messageContent", "Hello from userB to userA")
          .expect("Content-type", /json/)
          .expect(201);

        const typedResponseBody = response.body as { message: Message };

        expect(response.ok).toBe(true);
        expect(typedResponseBody.message).toStrictEqual({
          id: expect.any(String) as string,
          content: "Hello from userB to userA",
          imageUrl: "imageUrl",
          createdAt: expect.any(String) as string,
          senderId: userB.id,
          receiverId: userA.id,
          groupChatId: null,
        });
      });
    });

    describe("given two users are friends", () => {
      it("should successfully send message", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        const friendRequest = await friendshipModel.sendFriendRequest(userB.id, userA.id);

        await friendshipModel.acceptFriendRequest(friendRequest.id);

        const userBToken = issueJwt(userB.id, "10m");

        const buffer = Buffer.alloc(1024);

        const response = await request(app)
          .post(`/users/${userA.id}/messages`)
          .auth(userBToken, { type: "bearer" })
          .attach("messageImage", buffer, { filename: "fileName", contentType: "image/png" })
          .field("messageContent", "Hello from userB to userA")
          .expect("Content-type", /json/)
          .expect(201);

        const typedResponseBody = response.body as { message: Message };

        expect(response.ok).toBe(true);
        expect(typedResponseBody.message).toStrictEqual({
          id: expect.any(String) as string,
          content: "Hello from userB to userA",
          imageUrl: "imageUrl",
          createdAt: expect.any(String) as string,
          senderId: userB.id,
          receiverId: userA.id,
          groupChatId: null,
        });
      });
    });

    describe("given two users are not friends", () => {
      it("should successfully send message", async () => {
        expect.hasAssertions();

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        const userBToken = issueJwt(userB.id, "10m");

        const buffer = Buffer.alloc(1024);

        const response = await request(app)
          .post(`/users/${userA.id}/messages`)
          .auth(userBToken, { type: "bearer" })
          .attach("messageImage", buffer, { filename: "fileName", contentType: "image/png" })
          .field("messageContent", "Hello from userB to userA")
          .expect("Content-type", /json/)
          .expect(201);

        const typedResponseBody = response.body as { message: Message };

        expect(response.ok).toBe(true);
        expect(typedResponseBody.message).toStrictEqual({
          id: expect.any(String) as string,
          content: "Hello from userB to userA",
          imageUrl: "imageUrl",
          createdAt: expect.any(String) as string,
          senderId: userB.id,
          receiverId: userA.id,
          groupChatId: null,
        });
      });
    });

    describe("given rejected promise during upload", () => {
      it("should return 500 status when an error occurs during upload", async () => {
        expect.hasAssertions();

        vi.mocked(cloudinary.uploader.upload_stream).mockImplementationOnce(
          (_options?: UploadApiOptions, cb?: UploadResponseCallback) => {
            return {
              end: () => {
                if (cb) {
                  cb({ http_code: 499, message: "FAILED", name: "TimeoutError" }, undefined);
                }
              },
            } as UploadStream;
          }
        );

        const userA = await userModel.createUserRecord("userA", "12345");
        const userB = await userModel.createUserRecord("userB", "12345");

        const userBToken = issueJwt(userB.id, "10m");

        const buffer = Buffer.alloc(1024);

        const response = await request(app)
          .post(`/users/${userA.id}/messages`)
          .auth(userBToken, { type: "bearer" })
          .attach("messageImage", buffer, { filename: "fileName", contentType: "image/png" })
          .field("messageContent", "Hello from userB to userA")
          .expect(500);

        expect(response.serverError).toBe(true);
      });
    });
  });

  describe("get non-friends of user GET /users/me/anonymous", () => {
    describe("given GET request", () => {
      let userA: Omit<User, "password">;
      let userB: Omit<User, "password">;
      let userC: Omit<User, "password">;

      beforeEach(async () => {
        userA = await userModel.createUserRecord("userA", "12345");
        userB = await userModel.createUserRecord("userB", "12345");
        userC = await userModel.createUserRecord("userC", "12345");

        const { id: userBFriendRequestId } = await friendshipModel.sendFriendRequest(userB.id, userA.id);
        const { id: userCFriendRequestId } = await friendshipModel.sendFriendRequest(userC.id, userA.id);

        await friendshipModel.acceptFriendRequest(userBFriendRequestId);
        await friendshipModel.acceptFriendRequest(userCFriendRequestId);
      });

      it("should return userA's non-friends", async () => {
        expect.hasAssertions();

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .get("/users/me/anonymous")
          .auth(userAToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as {
          nonFriends: Omit<User, "password" | "lastSeen" | "isGuest">[];
        };

        expect(typedResponseBody.nonFriends).toHaveLength(0);
      });

      it("should return userB's non-friends", async () => {
        expect.hasAssertions();

        const userBToken = issueJwt(userB.id, "10m");

        const response = await request(app)
          .get("/users/me/anonymous")
          .auth(userBToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as {
          nonFriends: Omit<User, "password" | "lastSeen" | "isGuest">[];
        };

        expect(typedResponseBody.nonFriends).toStrictEqual<Omit<User, "password" | "lastSeen" | "isGuest">[]>(
          [
            {
              id: userC.id,
              imageUrl: null,
              username: "userC",
            },
          ]
        );
      });

      it("should return return userC's non-friends", async () => {
        expect.hasAssertions();

        const userCToken = issueJwt(userC.id, "10m");

        const response = await request(app)
          .get("/users/me/anonymous")
          .auth(userCToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as {
          nonFriends: Omit<User, "password" | "lastSeen" | "isGuest">[];
        };

        expect(typedResponseBody.nonFriends).toStrictEqual<Omit<User, "password" | "lastSeen" | "isGuest">[]>(
          [
            {
              id: userB.id,
              imageUrl: null,
              username: "userB",
            },
          ]
        );
      });
    });
  });

  describe.todo("test updating user profile picture");
});
