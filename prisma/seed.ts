import { PrismaClient, Role, RecordType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed users — one per role
  const passwordHash = await hash('password123', 12);

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@finvault.com' },
    update: {},
    create: {
      name: 'Finance Viewer',
      email: 'viewer@finvault.com',
      password: passwordHash,
      role: Role.VIEWER,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@finvault.com' },
    update: {},
    create: {
      name: 'Finance Analyst',
      email: 'analyst@finvault.com',
      password: passwordHash,
      role: Role.ANALYST,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@finvault.com' },
    update: {},
    create: {
      name: 'Finance Admin',
      email: 'admin@finvault.com',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  // Seed financial records
  const categories = [
    'salary',
    'freelance',
    'rent',
    'groceries',
    'utilities',
    'transport',
    'entertainment',
    'healthcare',
    'investment',
    'consulting',
  ];

  const records: Array<{
    amount: number;
    type: RecordType;
    category: string;
    date: Date;
    notes: string;
    createdBy: string;
  }> = [];

  for (let i = 0; i < 25; i++) {
    const isIncome = Math.random() > 0.45;
    const category =
      categories[Math.floor(Math.random() * categories.length)];
    const month = Math.floor(Math.random() * 6);
    const day = Math.floor(Math.random() * 28) + 1;

    records.push({
      amount: isIncome
        ? Math.round((Math.random() * 5000 + 500) * 100) / 100
        : Math.round((Math.random() * 2000 + 50) * 100) / 100,
      type: isIncome ? RecordType.INCOME : RecordType.EXPENSE,
      category,
      date: new Date(2026, month, day),
      notes: `Sample ${isIncome ? 'income' : 'expense'} record #${
        i + 1
      }`,
      createdBy: admin.id,
    });
  }

  await prisma.financialRecord.createMany({ data: records });

  console.log(
    `Seeded: 3 users (${viewer.email}, ${analyst.email}, ${admin.email}) + ${records.length} records`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
