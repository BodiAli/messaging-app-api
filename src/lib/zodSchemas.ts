import * as z from "zod";

export const UserSignUpSchema = z
  .strictObject({
    username: z
      .string("Please provide a string username.")
      .trim()
      .nonempty("Username cannot be empty.")
      .max(100, "Username cannot exceed 100 characters."),
    password: z.string("Please provide a string password.").min(5, "Password must be at least 5 characters."),
    confirmPassword: z.string("Please provide a string confirmPassword."),
  })
  .refine(
    (data) => {
      return data.password === data.confirmPassword;
    },
    {
      error: "Passwords do not match.",
      path: ["confirmPassword"],
    }
  );

export const UserLogInSchema = z.strictObject({
  username: z.string("Please provide a string username.").trim().nonempty("Username cannot be empty."),
  password: z.string("Please provide a string password.").nonempty("Password cannot be empty."),
});

export const MessageContentSchema = z.strictObject({
  messageContent: z.string("Please provide a string content").trim().nonempty("Message cannot be empty."),
});

export const FileSchema = z.optional(
  z.object({
    mimetype: z.string().startsWith("image/", { error: "File must be of type image." }),
    size: z.number().max(5242880, { error: "File cannot exceed 5MBs." }),
  })
);

export const GroupSchema = z.strictObject({
  groupName: z.string("Please provide a string group name.").trim().nonempty("Group name cannot be empty."),
});

export const SendGroupInviteToUsers = z.strictObject({
  userIds: z
    .array(z.string("userIds must be an array of strings."), {
      error: "userIds must be an array of strings.",
    })
    .nonempty("At least 1 user id must be provided."),
});
