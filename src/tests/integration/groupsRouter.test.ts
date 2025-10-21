import express from "express";
import { describe, expect, it } from "vitest";
import request from "supertest";
import usersRouter from "../../routes/usersRouter.js";
import "../../config/passportConfig.js";

const app = express();

app.use(express.json());

// Testing /users/:userId/groups routes
app.use("/users", usersRouter);

describe("groupsRouter routes", () => {
  describe("get user groups GET /users/userId/groups", () => {
    describe("given non-existing userId", () => {
      it("should return 404 status with error message", async () => {
        expect.hasAssertions();

        const response = await request(app)
          .get("/users/nonExisting/groups")
          .expect("Content-type", /json/)
          .expect(200);

        console.log(response.text);
      });
    });
  });
});
