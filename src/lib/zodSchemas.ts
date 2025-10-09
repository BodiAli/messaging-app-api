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
