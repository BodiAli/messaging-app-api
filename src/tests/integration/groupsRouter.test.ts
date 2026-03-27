import express from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import usersRouter from "../../routes/usersRouter.js";
import * as userModel from "../../models/userModel.js";
import * as groupModel from "../../models/groupModel.js";
import issueJwt from "../../lib/issueJwt.js";
import cloudinary from "../../config/cloudinaryConfig.js";
import type { GroupChat, Message, User } from "../../generated/prisma/index.js";
import type ResponseError from "../../types/responseError.js";
import type {
  UploadStream,
  UploadApiResponse,
  UploadResponseCallback,
  UploadApiOptions,
} from "cloudinary";
import "../../config/passportConfig.js";

const app = express();

app.use(express.json());

// Testing /users/me/groups routes
app.use("/users", usersRouter);

describe("groupsRouter routes", () => {
  let currentUser: Omit<User, "password">;
  let userA: Omit<User, "password">;
  let userB: Omit<User, "password">;
  let userAGroup: GroupChat;
  let userBGroup: GroupChat;
  let currentUserGroup: GroupChat;

  beforeEach(async () => {
    /**
     * currentUser owns a group and is a member of userA's group.
     * userA owns a group and is not a member of any group.
     * userB owns a group and is not a member of any group.
     */

    currentUser = await userModel.createUserRecord("currentUser", "12345");
    userA = await userModel.createUserRecord("userA", "12345");
    userB = await userModel.createUserRecord("userB", "12345");

    currentUserGroup = await groupModel.createGroup(
      "currentUser's group",
      currentUser.id,
    );
    userAGroup = await groupModel.createGroup("userA's group", userA.id);
    userBGroup = await groupModel.createGroup("userB's group", userB.id);

    await groupModel.sendGroupInviteToUsers(userAGroup.id, userA.id, [
      currentUser.id,
    ]);

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
    describe("given guest user", () => {
      it("should return 403 status with error message", async () => {
        expect.hasAssertions();

        const currentUser = await userModel.getOrCreateUserRecord(
          "guest",
          "12345",
        );

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .post("/users/me/groups")
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(403);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors).toStrictEqual<ResponseError["errors"]>(
          [
            {
              message: "You must have an account to complete this request.",
            },
          ],
        );
      });
    });

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

  describe("all requests for /users/me/groups/:groupId", () => {
    describe("given guest user", () => {
      it("should return 403 status with error message", async () => {
        expect.hasAssertions();

        const currentUser = await userModel.getOrCreateUserRecord(
          "guest",
          "12345",
        );

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .get("/users/me/groups/groupId")
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(403);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors).toStrictEqual<ResponseError["errors"]>(
          [
            {
              message: "You must have an account to complete this request.",
            },
          ],
        );
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
            {
              message:
                "Group not found! it may have been moved, deleted or it might have never existed.",
            },
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
          group: Omit<GroupChat, "adminId"> & {
            users: Pick<User, "id" | "imageUrl" | "username">[];
          } & {
            admin: Pick<User, "id" | "imageUrl" | "username">;
          };
        };

        expect(typedResponseBody.group).toStrictEqual<
          Omit<GroupChat, "adminId"> & {
            users: Pick<User, "id" | "imageUrl" | "username">[];
          } & {
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

  describe("all requests for /users/me/groups/:groupId/notifications", () => {
    describe("given guest user", () => {
      it("should return 403 status with error message", async () => {
        expect.hasAssertions();

        const currentUser = await userModel.getOrCreateUserRecord(
          "guest",
          "12345",
        );

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .get("/users/me/groups/groupId/notifications")
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(403);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors).toStrictEqual<ResponseError["errors"]>(
          [
            {
              message: "You must have an account to complete this request.",
            },
          ],
        );
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

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [{ message: "Group not found." }],
        });
      });
    });

    describe("given invalid userIds input", () => {
      it("should return 400 status with error message when userIds is not an array", async () => {
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

      it("should return 400 status with error message when userIds is empty", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .post(`/users/me/groups/${currentUserGroup.id}/notifications`)
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ userIds: [] })
          .expect("Content-type", /json/)
          .expect(400);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            expect.objectContaining({
              message: "At least 1 user id must be provided.",
            }) as { message: string },
          ],
        });
      });

      it("should return 422 status with error message if userId does not exist", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .post(`/users/me/groups/${currentUserGroup.id}/notifications`)
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ userIds: ["nonExistingId"] })
          .expect("Content-type", /json/)
          .expect(422);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            expect.objectContaining({
              message: "Invalid user ID.",
            }) as { message: string },
          ],
        });
      });

      it("should return 422 status with error message group admin invites themselves", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .post(`/users/me/groups/${currentUserGroup.id}/notifications`)
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ userIds: [currentUser.id] })
          .expect("Content-type", /json/)
          .expect(422);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            expect.objectContaining({
              message: "You cannot invite yourself to this group.",
            }) as { message: string },
          ],
        });
      });
    });

    describe("given valid userIds input", () => {
      it("should return 201 status", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .post(`/users/me/groups/${currentUserGroup.id}/notifications`)
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ userIds: [userA.id] })
          .expect(201);

        expect(response.ok).toBe(true);
      });
    });
  });

  describe("delete group invite DELETE /users/me/groups/:groupId/notifications", () => {
    describe("given non-existing group id", () => {
      it("should return 404 status with error message", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");
        const userBToken = issueJwt(userB.id, "10m");

        await request(app)
          .post(`/users/me/groups/${userBGroup.id}/notifications`)
          .auth(userBToken, { type: "bearer" })
          .send({ userIds: [currentUser.id] })
          .expect(201);

        const response = await request(app)
          .delete("/users/me/groups/notExists/notifications")
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(404);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "No invite found to reject.",
            },
          ],
        });
      });
    });

    describe("given valid group id", () => {
      it("should return 204 status", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");
        const userBToken = issueJwt(userB.id, "10m");

        await request(app)
          .post(`/users/me/groups/${userBGroup.id}/notifications`)
          .auth(userBToken, { type: "bearer" })
          .send({ userIds: [currentUser.id] })
          .expect(201);

        const response = await request(app)
          .delete(`/users/me/groups/${userBGroup.id}/notifications`)
          .auth(currentUserToken, { type: "bearer" })
          .expect(204);

        expect(response.noContent).toBe(true);
      });
    });
  });

  describe("accept group invite PATCH /users/me/groups/:groupId/notifications", () => {
    describe("given non-existing group id", () => {
      it("should return 404 status with error message", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");
        const userBToken = issueJwt(userB.id, "10m");

        await request(app)
          .post(`/users/me/groups/${userBGroup.id}/notifications`)
          .auth(userBToken, { type: "bearer" })
          .send({ userIds: [currentUser.id] })
          .expect(201);

        const response = await request(app)
          .patch("/users/me/groups/notExists/notifications")
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(404);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "No invite found to accept.",
            },
          ],
        });
      });
    });

    describe("given valid group id", () => {
      it("should return 204 status", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");
        const userBToken = issueJwt(userB.id, "10m");

        await request(app)
          .post(`/users/me/groups/${userBGroup.id}/notifications`)
          .auth(userBToken, { type: "bearer" })
          .send({ userIds: [currentUser.id] })
          .expect(201);

        const response = await request(app)
          .patch(`/users/me/groups/${userBGroup.id}/notifications`)
          .auth(currentUserToken, { type: "bearer" })
          .expect(204);

        expect(response.noContent).toBe(true);
      });
    });
  });

  describe("update group name PATCH /users/me/groups/:groupId", () => {
    describe("given non-existing group id", () => {
      it("should return 404 status with error message", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .patch("/users/me/groups/nonExisting")
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ groupName: "new group name" })
          .expect("Content-type", /json/)
          .expect(404);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "Group not found.",
            },
          ],
        });
      });
    });

    describe("given non-admin user", () => {
      it("should return 403 status with error message", async () => {
        expect.hasAssertions();

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .patch(`/users/me/groups/${currentUserGroup.id}`)
          .auth(userAToken, { type: "bearer" })
          .type("json")
          .send({ groupName: "new group name" })
          .expect("Content-type", /json/)
          .expect(403);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "You do not have permission to update this group name.",
            },
          ],
        });
      });
    });

    describe("given invalid group name input", () => {
      it("should return 400 status with error message", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .patch(`/users/me/groups/${currentUserGroup.id}`)
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ groupName: "  " })
          .expect("Content-type", /json/)
          .expect(400);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            expect.objectContaining({
              message: "Group name cannot be empty.",
            }) as { message: string },
          ],
        });
      });
    });

    describe("given valid group name", () => {
      it("should return 200 status with updated group object", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .patch(`/users/me/groups/${currentUserGroup.id}`)
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ groupName: "new group name" })
          .expect("Content-type", /json/)
          .expect(200);

        const typedResponseBody = response.body as { group: GroupChat };

        expect(typedResponseBody).toStrictEqual<{ group: GroupChat }>({
          group: {
            adminId: currentUser.id,
            createdAt: expect.any(String) as Date,
            id: currentUserGroup.id,
            name: "new group name",
          },
        });
      });
    });
  });

  describe("remove group member DELETE /users/me/groups/:groupId/members/:memberId", () => {
    describe("given guest user", () => {
      it("should return 403 status with error message", async () => {
        expect.hasAssertions();

        const currentUser = await userModel.getOrCreateUserRecord(
          "guest",
          "12345",
        );

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .delete("/users/me/groups/groupId/members/memberId")
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(403);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody.errors).toStrictEqual<ResponseError["errors"]>(
          [
            {
              message: "You must have an account to complete this request.",
            },
          ],
        );
      });
    });

    describe("given non-existing group id", () => {
      it("should return 404 status with error message", async () => {
        expect.hasAssertions();

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .delete(`/users/me/groups/notExists/members/${currentUser.id}`)
          .auth(userAToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(404);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "Group not found.",
            },
          ],
        });
      });
    });

    describe("given non-existing memberId", () => {
      it("should return 404 status with error message", async () => {
        expect.hasAssertions();

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .delete(`/users/me/groups/${userAGroup.id}/members/notExits`)
          .auth(userAToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(404);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "No member found to remove.",
            },
          ],
        });
      });
    });

    describe("given non-admin or not same user tries to remove user/themselves", () => {
      it("should return 403 status with error message", async () => {
        expect.hasAssertions();

        const userBToken = issueJwt(userB.id, "10m");

        const response = await request(app)
          .delete(`/users/me/groups/${userAGroup.id}/members/${currentUser.id}`)
          .auth(userBToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(403);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "You do not have permission to remove this member.",
            },
          ],
        });
      });
    });

    describe("given user is admin", () => {
      it("should return 204 status", async () => {
        expect.hasAssertions();

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .delete(`/users/me/groups/${userAGroup.id}/members/${currentUser.id}`)
          .auth(userAToken, { type: "bearer" })
          .expect(204);

        expect(response.noContent).toBe(true);
      });
    });

    describe("given user tries removing themselves", () => {
      it("should return 204 status", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .delete(`/users/me/groups/${userAGroup.id}/members/${currentUser.id}`)
          .auth(currentUserToken, { type: "bearer" })
          .expect(204);

        expect(response.noContent).toBe(true);
      });
    });
  });

  describe("delete group DELETE /users/me/groups/:groupId", () => {
    describe("given non-existing group id", () => {
      it("should return 404 status with error message", async () => {
        expect.hasAssertions();

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .delete("/users/me/groups/notExists")
          .auth(userAToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(404);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "Group not found.",
            },
          ],
        });
      });
    });

    describe("given current user is not group admin", () => {
      it("should return 403 status with error message", async () => {
        expect.hasAssertions();

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .delete(`/users/me/groups/${currentUserGroup.id}`)
          .auth(userAToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(403);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "You do not have permission to delete this group.",
            },
          ],
        });
      });
    });

    describe("given current user is admin and group id is valid", () => {
      it("should return 204 status", async () => {
        expect.hasAssertions();

        const userAToken = issueJwt(userA.id, "10m");
        const currentUserToken = issueJwt(currentUser.id, "10m");

        const currentUserResponse1 = await request(app)
          .get(`/users/me/groups`)
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const currentUserBeforeDelete = currentUserResponse1.body as {
          groups: GroupChat[];
        };

        expect(currentUserBeforeDelete.groups).toStrictEqual<GroupChat[]>([
          {
            adminId: currentUser.id,
            createdAt: expect.any(String) as Date,
            id: currentUserGroup.id,
            name: "currentUser's group",
          },
          {
            adminId: userA.id,
            createdAt: expect.any(String) as Date,
            id: userAGroup.id,
            name: "userA's group",
          },
        ]);

        const response = await request(app)
          .delete(`/users/me/groups/${userAGroup.id}`)
          .auth(userAToken, { type: "bearer" })
          .expect(204);

        expect(response.noContent).toBe(true);

        const currentUserResponse2 = await request(app)
          .get(`/users/me/groups`)
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);

        const currentUserGroupsAfterDelete = currentUserResponse2.body as {
          groups: GroupChat[];
        };

        expect(currentUserGroupsAfterDelete.groups).toStrictEqual<GroupChat[]>([
          {
            adminId: currentUser.id,
            createdAt: expect.any(String) as Date,
            id: currentUserGroup.id,
            name: "currentUser's group",
          },
        ]);
      });
    });
  });

  describe("send message to group POST /users/me/groups/:groupId/messages", () => {
    describe("given non-existing group id", () => {
      it("should return 404 status with error message", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .post("/users/me/groups/notExists/messages")
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ messageContent: "messageContent" })
          .expect("Content-type", /json/)
          .expect(404);

        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "Group not found.",
            },
          ],
        });
      });
    });

    describe("given current user is not a member or an admin of the group", () => {
      it("should return 403 status with error message", async () => {
        expect.hasAssertions();

        const userAToken = issueJwt(userA.id, "10m");

        const response = await request(app)
          .post(`/users/me/groups/${userBGroup.id}/messages`)
          .auth(userAToken, { type: "bearer" })
          .type("json")
          .send({ messageContent: "messageContent" })
          .expect("Content-type", /json/)
          .expect(403);
        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "You cannot send message to this group.",
            },
          ],
        });
      });
    });

    describe("given invalid inputs", () => {
      it("should return 400 status when messageImage is more than 5MB", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");
        const buffer = Buffer.alloc(1024 * 1024 * 5 + 1);

        const response = await request(app)
          .post(`/users/me/groups/${userAGroup.id}/messages`)
          .auth(currentUserToken, { type: "bearer" })
          .attach("messageImage", buffer, {
            filename: "fileName",
            contentType: "image/png",
          })
          .expect("Content-type", /json/)
          .expect(400);
        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toMatchObject<ResponseError>({
          errors: [
            {
              message: "File cannot exceed 5MBs.",
            },
          ],
        });
      });

      it("should return 400 status when messageImage is not of type image", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");
        const buffer = Buffer.alloc(1024 * 1024 * 5);

        const response = await request(app)
          .post(`/users/me/groups/${userAGroup.id}/messages`)
          .attach("messageImage", buffer, {
            filename: "fileName",
            contentType: "test/html",
          })
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(400);
        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toMatchObject({
          errors: [
            {
              message: "File must be of type image.",
            },
          ],
        });
      });

      it("should return 400 status when messageContent is empty", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .post(`/users/me/groups/${userAGroup.id}/messages`)
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ messageContent: " " })
          .expect("Content-type", /json/)
          .expect(400);
        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toMatchObject<ResponseError>({
          errors: [
            {
              message: "Message cannot be empty.",
            },
          ],
        });
      });
    });

    describe("given valid inputs", () => {
      interface MessageResponse {
        message: Omit<Message, "createdAt"> & { createdAt: string };
      }

      it("should return 201 and create message when messageImage is not defined", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .post(`/users/me/groups/${userAGroup.id}/messages`)
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ messageContent: "message-content" })
          .expect("Content-type", /json/)
          .expect(201);
        const typedResponseBody = response.body as MessageResponse;

        expect(typedResponseBody).toStrictEqual<MessageResponse>({
          message: {
            content: "message-content",
            createdAt: expect.any(String) as string,
            groupChatId: userAGroup.id,
            id: expect.any(String) as string,
            imageUrl: null,
            receiverId: null,
            senderId: currentUser.id,
          },
        });
      });

      it("should return 201 and create message when messageContent and messageImage are valid", async () => {
        expect.hasAssertions();

        vi.spyOn(cloudinary.uploader, "upload_stream").mockImplementation(
          (_options?: UploadApiOptions, cb?: UploadResponseCallback) => {
            return {
              end: () => {
                if (cb) {
                  cb(undefined, {
                    secure_url: "imageUrl",
                  } as UploadApiResponse);
                }
              },
            } as UploadStream;
          },
        );
        const currentUserToken = issueJwt(currentUser.id, "10m");
        const buffer = Buffer.alloc(1024 * 1024 * 5);

        const response = await request(app)
          .post(`/users/me/groups/${userAGroup.id}/messages`)
          .auth(currentUserToken, { type: "bearer" })
          .attach("messageImage", buffer, {
            contentType: "image/png",
            filename: "fileName",
          })
          .field("messageContent", "message-content")
          .expect("Content-type", /json/)
          .expect(201);
        const typedResponseBody = response.body as MessageResponse;

        expect(typedResponseBody).toStrictEqual<MessageResponse>({
          message: {
            content: "message-content",
            createdAt: expect.any(String) as string,
            groupChatId: userAGroup.id,
            id: expect.any(String) as string,
            imageUrl: "imageUrl",
            receiverId: null,
            senderId: currentUser.id,
          },
        });
      });
    });

    describe("given rejected promise during upload", () => {
      it("should return 500 status", async () => {
        expect.hasAssertions();

        vi.spyOn(cloudinary.uploader, "upload_stream").mockImplementation(
          (_options?: UploadApiOptions, cb?: UploadResponseCallback) => {
            return {
              end: () => {
                if (cb) {
                  cb({
                    http_code: 499,
                    message: "FAILED",
                    name: "TimeoutError",
                  });
                }
              },
            } as UploadStream;
          },
        );
        const currentUserToken = issueJwt(currentUser.id, "10m");
        const buffer = Buffer.alloc(1024 * 1024 * 5);

        const response = await request(app)
          .post(`/users/me/groups/${userAGroup.id}/messages`)
          .auth(currentUserToken, { type: "bearer" })
          .attach("messageImage", buffer, {
            contentType: "image/png",
            filename: "fileName",
          })
          .field("messageContent", "message-content")
          .expect(500);

        expect(response.serverError).toBe(true);
      });
    });
  });

  describe("get group messages GET /users/me/groups/:groupId/messages", () => {
    describe("given non-existing group id", () => {
      it("should return 404 with error message", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");

        const response = await request(app)
          .get("/users/me/groups/notExists/messages")
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(404);
        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "Group not found.",
            },
          ],
        });
      });
    });

    describe("given non-member or non-admin requesting group messages", () => {
      it("should return 403 status with error message", async () => {
        expect.hasAssertions();

        const userBToken = issueJwt(userB.id, "10m");

        const response = await request(app)
          .get(`/users/me/groups/${userAGroup.id}/messages`)
          .auth(userBToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(403);
        const typedResponseBody = response.body as ResponseError;

        expect(typedResponseBody).toStrictEqual<ResponseError>({
          errors: [
            {
              message: "You cannot view messages of this group.",
            },
          ],
        });
      });
    });

    describe("given member of group", () => {
      it("should return 200 status with group messages", async () => {
        expect.hasAssertions();

        const currentUserToken = issueJwt(currentUser.id, "10m");
        await request(app)
          .post(`/users/me/groups/${userAGroup.id}/messages`)
          .auth(currentUserToken, { type: "bearer" })
          .type("json")
          .send({ messageContent: "hello world!" })
          .expect(201);
        interface MessagesResponse {
          messages: (Omit<Message, "createdAt"> & {
            createdAt: string;
            sender: Omit<User, "password" | "isGuest" | "lastSeen">;
          })[];
        }

        const response = await request(app)
          .get(`/users/me/groups/${userAGroup.id}/messages`)
          .auth(currentUserToken, { type: "bearer" })
          .expect("Content-type", /json/)
          .expect(200);
        const typedResponseBody = response.body as MessagesResponse;

        expect(typedResponseBody).toStrictEqual<MessagesResponse>({
          messages: [
            {
              content: "hello world!",
              createdAt: expect.any(String) as string,
              groupChatId: userAGroup.id,
              id: expect.any(String) as string,
              imageUrl: null,
              receiverId: null,
              senderId: currentUser.id,
              sender: {
                id: currentUser.id,
                imageUrl: null,
                username: currentUser.username,
              },
            },
          ],
        });
      });
    });
  });
});
