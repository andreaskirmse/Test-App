import { z } from "zod"

export const createIdeaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Titel ist erforderlich")
    .max(100, "Titel darf maximal 100 Zeichen lang sein"),
  description: z
    .string()
    .trim()
    .min(20, "Beschreibung muss mindestens 20 Zeichen lang sein")
    .max(500, "Beschreibung darf maximal 500 Zeichen lang sein"),
})

export const updateIdeaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Titel ist erforderlich")
    .max(100, "Titel darf maximal 100 Zeichen lang sein")
    .optional(),
  description: z
    .string()
    .trim()
    .min(20, "Beschreibung muss mindestens 20 Zeichen lang sein")
    .max(500, "Beschreibung darf maximal 500 Zeichen lang sein")
    .optional(),
})

export type CreateIdeaFormValues = z.infer<typeof createIdeaSchema>
export type UpdateIdeaFormValues = z.infer<typeof updateIdeaSchema>
