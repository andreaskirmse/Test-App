import { z } from "zod"

export const createCommentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment cannot exceed 500 characters"),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
