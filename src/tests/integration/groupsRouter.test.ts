import express from "express";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import usersRouter from "../../routes/usersRouter.js";
import type { GroupChat, User } from "../../generated/prisma/index.js";
import * as userModel from "../../models/userModel.js";
import * as groupModel from "../../models/groupModel.js";
import issueJwt from "../../lib/issueJwt.js";
import type ResponseError from "../../types/responseError.js";
import "../../config/passportConfig.js";

const app = express();

app.use(express.json());

// Testing /users/me/groups routes
app.use("/users", usersRouter);

describe("groupsRouter routes", () => {
  let currentUser: Omit<User, "password">;
  let userA: Omit<User, "password">;
  let userAGroup: GroupChat;
  let currentUserGroup: GroupChat;

  beforeEach(async () => {
    currentUser = await userModel.createUserRecord("currentUser", "12345");
    userA = await userModel.createUserRecord("userA", "12345");

    currentUserGroup = await groupModel.createGroup("currentUser's group", currentUser.id);
    userAGroup = await groupModel.createGroup("userA's group", userA.id);

    await groupModel.sendGroupInviteToUsers(userAGroup.id, userA.id, [currentUser.id]);

    await groupModel.acceptGroupInvite(userAGroup.id, currentUser.id);
  });

  describe("get user groups GET /users/me/groups", () => {
    describe("given get request", () => {
      it("should return 200 status with all groups associated with current user", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .get("/users/me/groups")
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as { groups: GroupChat[] };

        expect(typedResponseBody.groups).toStrictEqual<GroupChat[]>([
          {
            adminId: currentUser.id,
            createdAt: expect.any(String) as Date,
            id: expect.any(String) as string,
            name: "currentUser's group",
          },
          {
            adminId: userA.id,
            createdAt: expect.any(String) as Date,
            id: expect.any(String) as string,
            name: "userA's group",
          },
        ]);
      });
    });
  });

  describe("create group POST /users/me/groups", () => {
    describe("given invalid inputs", () => {
      it("should return 400 status with errors", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .post("/users/me/groups")
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ groupName: "  " })
          .expect("Content-type", /json/)
          .expect(400);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors).toStrictEqual([
          expect.objectContaining({ message: "Group name cannot be empty." }),
        ]);
      });
    });

    describe("given valid inputs", () => {
      it("should return 201 status with created group", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .post("/users/me/groups")
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ groupName: "new group" })
          .expect("Content-type", /json/)
          .expect(201);

        const typedResponseBody = response.body as { group: GroupChat };

        expect(typedResponseBody.group).toStrictEqual<GroupChat>({
          adminId: currentUser.id,
          createdAt: expect.any(String) as Date,
          id: expect.any(String) as string,
          name: "new group",
        });
      });
    });
  });

  describe("get group details GET /users/me/groups/:groupId", () => {
    describe("given non-existing groupId", () => {
      it("should return 404 status with error message", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .get("/users/me/groups/nonExisting")
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(404);

        const typedResponseBody = (await response.body) as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            { message: "Group not found! it may have been moved, deleted or it might have never existed." },
          ],
        });
      });
    });

    describe("given a valid groupId", () => {
      it("should return 200 status and group with members", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .get(`/users/me/groups/${userAGroup.id}`)
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as {
          group: Omit<GroupChat, "adminId"> & { users: Pick<User, "id" | "imageUrl" | "username">[] } & {
            admin: Pick<User, "id" | "imageUrl" | "username">;
          };
        };

        expect(typedResponseBody.group).toStrictEqual<
          Omit<GroupChat, "adminId"> & { users: Pick<User, "id" | "imageUrl" | "username">[] } & {
            admin: Pick<User, "id" | "imageUrl" | "username">;
          }
        >({
          createdAt: expect.any(String) as Date,
          id: expect.any(String) as string,
          name: "userA's group",
          users: [
            {
              id: currentUser.id,
              imageUrl: null,
              username: "currentUser",
            },
          ],
          admin: {
            id: userA.id,
            imageUrl: null,
            username: "userA",
          },
        });
      });
    });
  });

  describe("create group invite POST /users/me/groups/:groupId/notifications", () => {
    describe("given non-existing group id", () => {
      it("should return 404 with an error message", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .post("/users/me/groups/nonExistingId/notifications")
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ userIds: [userA.id] })
          .expect("Content-type", /json/)
          .expect(404);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({ errors: [{ message: "Group not found." }] });
      });
    });

    describe("given invalid userIds as an array", () => {
      it("should return 400 status with error message", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .post(`/users/me/groups/${currentUserGroup.id}/notifications`)
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ userIds: "invalid" })
          .expect("Content-type", /json/)
          .expect(400);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            expect.objectContaining({
              message: "userIds must be an array of strings.",
            }) as { message: string },
          ],
        });
      });
    });
  });
});
