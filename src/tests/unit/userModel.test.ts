import { describe, expect, it } from "vitest";
import bcrypt from "bcrypt";
import {
  createUserRecord,
  getOrCreateUserRecord,
  getUserRecordById,
  getUserRecordByIdUnsafe,
  getUserRecordByUsername,
  updateUserRecordLastSeen,
} from "../../models/userModel.js";

describe("userModel queries", () => {
  describe(createUserRecord, () => {
    it("should create a new user record omitting the password field", async () => {
      expect.hasAssertions();

      const createdUser = await createUserRecord("bodi", "12345");

      expect(createdUser.id).toBeDefined();
      expect(createdUser.username).toBe("bodi");
      expect(createdUser.isGuest).toBe(false);
      expect(createdUser.imageUrl).toBeNull();

      // @ts-expect-error: createUserRecord does not include the password field to the returned object.
      // In contrast with createUserRecordUnsafe query which includes the password field
      expect(createdUser.password).toBeUndefined();
    });

    it("should hash the password before storing it", async () => {
      expect.hasAssertions();

      const createdUser = await createUserRecord("bodi", "12345");

      const userWithPasswordField = await getUserRecordByIdUnsafe(createdUser.id);

      if (!userWithPasswordField) {
        throw new Error("User not found");
      }

      const doesPasswordMatch = await bcrypt.compare("12345", userWithPasswordField.password);

      expect(userWithPasswordField.password).not.toBe("12345");
      expect(doesPasswordMatch).toBe(true);
    });
  });

  describe(getUserRecordById, () => {
    it.todo();
  });

  describe(getUserRecordByIdUnsafe, () => {
    it.todo();
  });

  describe(getUserRecordByUsername, () => {
    it.todo();
  });

  describe(getOrCreateUserRecord, () => {
    it("should create a new user record if user record does not exist", async () => {
      expect.hasAssertions();

      const doesNotExist = await getUserRecordByUsername("someUsername");

      expect(doesNotExist).toBeNull();

      await getOrCreateUserRecord("someUsername", "12345");

      const doesExist = await getUserRecordByUsername("someUsername");

      expect(doesExist).toBeDefined();
    });

    it("should get the user record if it already exists", async () => {
      expect.hasAssertions();

      await createUserRecord("someUsername", "12345");

      const doesExist = await getOrCreateUserRecord("someUsername", "54321");

      expect(doesExist).toBeDefined();
    });
  });

  describe(updateUserRecordLastSeen, () => {
    it("should update record lastSeen field", async () => {
      expect.hasAssertions();

      const createdUser = await createUserRecord("bodi", "12345");

      const updatedUser = await updateUserRecordLastSeen(createdUser.id);

      expect(updatedUser.lastSeen.getTime()).toBeGreaterThan(createdUser.lastSeen.getTime());
    });
  });
});
