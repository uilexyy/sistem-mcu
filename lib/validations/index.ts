import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

export const createPatientSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  dateOfBirth: z.string().min(1, "Tanggal lahir harus diisi"),
  gender: z.enum(["MALE", "FEMALE"], { required_error: "Jenis kelamin harus diisi" }),
  phone: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  address: z.string().optional(),
  bloodType: z.enum(["A", "B", "AB", "O"]).optional(),
  nik: z.string().regex(/^\d{16}$/, "NIK harus 16 digit").optional().or(z.literal("")),
})

export const createCheckupRegistrationSchema = z.object({
  patientId: z.string().min(1, "Pasien harus dipilih"),
  mcuPackageId: z.string().min(1, "Paket MCU harus dipilih"),
  scheduledDate: z.string().min(1, "Tanggal harus diisi"),
  notes: z.string().optional(),
})

export const createCheckupResultSchema = z.object({
  checkupId: z.string().min(1),
  examinationTypeId: z.string().min(1),
  valueNumeric: z.number().nullable().optional(),
  valueText: z.string().nullable().optional(),
  notes: z.string().optional(),
})

export const createReportSchema = z.object({
  checkupId: z.string().min(1),
  doctorConclusion: z.string().optional(),
  recommendation: z.string().optional(),
  fitnessStatus: z.enum(["FIT", "FIT_WITH_NOTES", "UNFIT"]),
})

export const createBillingSchema = z.object({
  checkupId: z.string().min(1),
  finalAmount: z.number().min(0, "Jumlah harus lebih dari 0"),
  discountAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "TRANSFER", "BPJS", "INSURANCE"]).optional(),
  insuranceProvider: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CreatePatientInput = z.infer<typeof createPatientSchema>
export type CreateCheckupRegistrationInput = z.infer<typeof createCheckupRegistrationSchema>
export type CreateCheckupResultInput = z.infer<typeof createCheckupResultSchema>
export type CreateReportInput = z.infer<typeof createReportSchema>
export type CreateBillingInput = z.infer<typeof createBillingSchema>
