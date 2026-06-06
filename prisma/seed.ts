import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@rs.com" },
    update: {},
    create: {
      name: "Admin Rumah Sakit",
      email: "admin@rs.com",
      password: adminPassword,
      role: "ADMIN",
      phone: "081234567890",
    },
  })

  console.log("Admin user created:", admin.email)

  const examTypes = await Promise.all([
    prisma.examinationType.create({
      data: { name: "Hemoglobin", category: "LAB", unit: "g/dL", normalRangeMin: 12, normalRangeMax: 16, description: "Pemeriksaan kadar hemoglobin darah" },
    }),
    prisma.examinationType.create({
      data: { name: "Kolesterol Total", category: "LAB", unit: "mg/dL", normalRangeMin: 0, normalRangeMax: 200, description: "Pemeriksaan kolesterol total" },
    }),
    prisma.examinationType.create({
      data: { name: "Gula Darah Puasa", category: "LAB", unit: "mg/dL", normalRangeMin: 70, normalRangeMax: 110, description: "Pemeriksaan gula darah puasa" },
    }),
    prisma.examinationType.create({
      data: { name: "Asam Urat", category: "LAB", unit: "mg/dL", normalRangeMin: 3.5, normalRangeMax: 7.0, description: "Pemeriksaan asam urat" },
    }),
    prisma.examinationType.create({
      data: { name: "SGOT", category: "LAB", unit: "U/L", normalRangeMin: 5, normalRangeMax: 40, description: "Pemeriksaan fungsi hati SGOT" },
    }),
    prisma.examinationType.create({
      data: { name: "SGPT", category: "LAB", unit: "U/L", normalRangeMin: 5, normalRangeMax: 40, description: "Pemeriksaan fungsi hati SGPT" },
    }),
    prisma.examinationType.create({
      data: { name: "Rontgen Thorax", category: "RADIOLOGY", isQuantitative: false, description: "Pemeriksaan rontgen dada" },
    }),
    prisma.examinationType.create({
      data: { name: "EKG", category: "PHYSICAL", isQuantitative: false, description: "Pemeriksaan elektrokardiogram" },
    }),
    prisma.examinationType.create({
      data: { name: "Tensi Darah", category: "PHYSICAL", unit: "mmHg", normalRangeMin: 90, normalRangeMax: 130, description: "Pemeriksaan tekanan darah" },
    }),
    prisma.examinationType.create({
      data: { name: "Indeks Massa Tubuh", category: "PHYSICAL", unit: "kg/m²", normalRangeMin: 18.5, normalRangeMax: 24.9, description: "Indeks massa tubuh" },
    }),
  ])

  console.log(`${examTypes.length} examination types created`)

  const basicPackage = await prisma.mcuPackage.create({
    data: {
      name: "Paket Basic",
      description: "Pemeriksaan dasar MCU meliputi tes darah dan fisik",
      price: 350000,
      examinations: {
        create: [
          { examinationTypeId: examTypes[0].id },
          { examinationTypeId: examTypes[1].id },
          { examinationTypeId: examTypes[2].id },
          { examinationTypeId: examTypes[8].id },
          { examinationTypeId: examTypes[9].id },
        ],
      },
    },
  })

  const executivePackage = await prisma.mcuPackage.create({
    data: {
      name: "Paket Eksekutif",
      description: "Pemeriksaan lengkap meliputi semua tes laboratorium, radiologi, dan fisik",
      price: 750000,
      examinations: {
        create: examTypes.map((et) => ({ examinationTypeId: et.id })),
      },
    },
  })

  console.log(`MCU packages created: ${basicPackage.name}, ${executivePackage.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
