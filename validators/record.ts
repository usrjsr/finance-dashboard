import { z } from "zod";

export const createRecordSchema = z.object({
  userId: z.string().optional(),
  amount: z
    .number({ error: "Amount is required and must be a number" })
    .positive("Amount must be greater than 0"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category cannot be empty").max(100).trim(),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format. Use ISO 8601 or YYYY-MM-DD",
    })
    .transform((val) => new Date(val)),
  description: z.string().max(500).trim().optional(),
});

export const updateRecordSchema = z
  .object({
    userId: z.string().optional(),
    amount: z.number().positive("Amount must be greater than 0").optional(),
    type: z.enum(["income", "expense"]).optional(),
    category: z.string().min(1).max(100).trim().optional(),
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      })
      .transform((val) => new Date(val))
      .optional(),
    description: z.string().max(500).trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const recordFilterSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 10)),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type RecordFilterInput = z.infer<typeof recordFilterSchema>;
