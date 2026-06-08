export type Role = "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "CASHIER" | "LAB" | "RADIOLOGY"
export type Gender = "MALE" | "FEMALE"
export type BloodType = "A" | "B" | "AB" | "O"
export type ExamCategory = "LAB" | "RADIOLOGY" | "PHYSICAL" | "SPECIALIST"
export type CheckupStatus = "REGISTERED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
export type ResultStatus = "NORMAL" | "ABNORMAL" | "BORDERLINE"
export type FitnessStatus = "FIT" | "FIT_WITH_NOTES" | "UNFIT"
export type PaymentMethod = "CASH" | "TRANSFER" | "BPJS" | "INSURANCE"
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED"
export type QueueStatus = "WAITING" | "CALLED" | "IN_EXAMINATION" | "DONE" | "SKIPPED"

export interface User {
  id: string
  name: string | null
  email: string
  role: Role
  phone: string | null
  isActive: boolean
}

export interface Patient {
  id: string
  medicalRecordNumber: string
  name: string
  dateOfBirth: string
  gender: Gender
  phone: string | null
  email: string | null
  address: string | null
  bloodType: BloodType | null
  nik: string | null
  photo: string | null
}

export interface McuPackage {
  id: string
  name: string
  description: string | null
  price: number
  isActive: boolean
  examinations: ExaminationType[]
}

export interface ExaminationType {
  id: string
  name: string
  category: ExamCategory
  unit: string | null
  normalRangeMin: number | null
  normalRangeMax: number | null
  description: string | null
  isQuantitative: boolean
}

export interface CheckupRegistration {
  id: string
  registrationNumber: string
  patientId: string
  mcuPackageId: string
  registeredById: string
  scheduledDate: string
  status: CheckupStatus
  notes: string | null
  patient: Patient
  mcuPackage: McuPackage
  registeredBy: User
  results: CheckupResult[]
  report: CheckupReport | null
  billing: Billing | null
  queue: QueueEntry[]
}

export interface CheckupResult {
  id: string
  checkupId: string
  examinationTypeId: string
  valueNumeric: number | null
  valueText: string | null
  status: ResultStatus
  notes: string | null
  attachmentUrl: string | null
  examinedById: string
  examinedAt: string
  examinationType: ExaminationType
}

export interface CheckupReport {
  id: string
  checkupId: string
  doctorConclusion: string | null
  recommendation: string | null
  fitnessStatus: FitnessStatus
  reviewedById: string
  reviewedAt: string
  reportUrl: string | null
  issuedAt: string | null
}

export interface Billing {
  id: string
  checkupId: string
  totalAmount: number
  discountAmount: number
  finalAmount: number
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod | null
  insuranceProvider: string | null
  paidAt: string | null
  receiptNumber: string | null
  handledById: string
}

export interface QueueEntry {
  id: string
  checkupId: string
  station: ExamCategory
  queueNumber: number
  status: QueueStatus
  calledAt: string | null
  doneAt: string | null
  patient: Patient
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  entity: string
  entityId: string
  oldValue: unknown
  newValue: unknown
  ipAddress: string | null
  createdAt: string
}

export interface DashboardStats {
  totalPatientsToday: number
  inProgress: number
  completed: number
  totalRevenue: number
}
