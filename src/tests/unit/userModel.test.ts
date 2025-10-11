import { describe, expect, it } from "vitest";
import bcrypt from "bcrypt";
import * as userModel from "../../models/userModel.js";

describe("userModel queries", () => {
  describe(userModel.createUserRecord, () => {
    it("should create a new user record omitting the password field", async () => {
      expect.hasAssertions();

      const createdUser = await userModel.createUserRecord("bodi", "12345");

      expect(createdUser).toStrictEqual({
        id: createdUser.id,
        username: "bodi",
        isGuest: false,
        imageUrl: null,
        lastSeen: expect.any(Date) as Date,
      });
    });

    it("should hash the password before storing it", async () => {
      expect.hasAssertions();

      const createdUser = await userModel.createUserRecord("bodi", "12345");

      const userWithPasswordField = await userModel.getUserRecordByIdUnsafe(createdUser.id);

      if (!userWithPasswordField) {
        throw new Error("User not found");
      }

      const doesPasswordMatch = await bcrypt.compare("12345", userWithPasswordField.password);

      expect(userWithPasswordField.password).not.toBe("12345");
      expect(doesPasswordMatch).toBe(true);
    });
  });

  describe(userModel.getUserRecordById, () => {
    it("should get user record without password field", async () => {
      expect.hasAssertions();

      const createdUser = await userModel.createUserRecord("bodi", "12345");

      const foundUser = await userModel.getUserRecordById(createdUser.id);

      if (!foundUser) {
        throw new Error("User not found");
      }

      expect(foundUser.id).toBe(createdUser.id);
      expect(foundUser.username).toBe("bodi");
      // @ts-expect-error: getUserRecordById does not include the password in the returned object.
      expect(foundUser.password).toBeUndefined();
    });
  });

  describe(userModel.getUserRecordByIdUnsafe, () => {
    it("should get user record with password field", async () => {
      expect.hasAssertions();

      const createdUser = await userModel.createUserRecord("bodi", "12345");

      const foundUser = await userModel.getUserRecordByIdUnsafe(createdUser.id);

      if (!foundUser) {
        throw new Error("User not found");
      }

      expect(foundUser.id).toBe(createdUser.id);
      expect(foundUser.username).toBe("bodi");
      expect(foundUser.password).toBeDefined();
    });
  });

  describe(userModel.getUserRecordByUsername, () => {
    it("should get user record given only username", async () => {
      expect.hasAssertions();

      await userModel.createUserRecord("bodi", "12345");

      const foundUser = await userModel.getUserRecordByUsername("bodi");

      if (!foundUser) {
        throw new Error("User not found");
      }

      expect(foundUser.username).toBe("bodi");
    });
  });

  describe(userModel.getOrCreateUserRecord, () => {
    it("should create a new user record if user record does not exist", async () => {
      expect.hasAssertions();

      const doesNotExist = await userModel.getUserRecordByUsername("someUsername");

      expect(doesNotExist).toBeNull();

      await userModel.getOrCreateUserRecord("someUsername", "12345");

      const doesExist = await userModel.getUserRecordByUsername("someUsername");

      expect(doesExist).toBeDefined();
    });

    it("should get the user record if it already exists", async () => {
      expect.hasAssertions();

      const existingUser = await userModel.createUserRecord("someUsername", "12345");

      const doesExist = await userModel.getOrCreateUserRecord("someUsername", "54321");

      expect(doesExist).toBeDefined();
      expect(doesExist.id).toBe(existingUser.id);
    });
  });

  describe(userModel.updateUserRecordLastSeen, () => {
    it("should update record lastSeen field", async () => {
      expect.hasAssertions();

      const createdUser = await userModel.createUserRecord("bodi", "12345");

      const updatedUser = await userModel.updateUserRecordLastSeen(createdUser.id);

      expect(updatedUser.lastSeen.getTime()).toBeGreaterThan(createdUser.lastSeen.getTime());
    });
  });
});
