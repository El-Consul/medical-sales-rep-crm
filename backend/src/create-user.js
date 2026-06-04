const prisma = require('./db');
const bcrypt = require('bcryptjs');

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node src/create-user.js <email> <password> <name>');
  process.exit(1);
}

const [email, password, name] = args;

async function main() {
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.error('❌ خطأ: البريد الإلكتروني مسجل بالفعل.');
      process.exit(1);
    }

    // Hash password with bcrypt before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        reminderEmail: email
      }
    });

    console.log(`✅ تم إنشاء المستخدم بنجاح:`);
    console.log(`- الاسم: ${user.name}`);
    console.log(`- البريد الإلكتروني: ${user.email}`);
    console.log(`- الرقم التعريفي (ID): ${user.id}`);
  } catch (error) {
    console.error('❌ حدث خطأ أثناء إنشاء المستخدم:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
