import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './schemas/user.schema';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get(getModelToken(User.name));

  console.log('🌱 Starting seed...');

  // Remove any existing admin to avoid duplicate key errors
  await userModel.deleteMany({ role: UserRole.ADMIN });

  // Create Admin User Account
  const hashedPassword = await bcrypt.hash('password123', 10);

  await userModel.create({
    userId: 'admin',
    password: hashedPassword,
    role: UserRole.ADMIN,
    email: 'admin@school.com',
    name: 'System Administrator',
    phone: '9999999999',
    isActive: true,
  });

  console.log('✅ Admin user created!');
  console.log('📝 Login credentials:');
  console.log('   userId  : admin');
  console.log('   password: password123');
  console.log('⚠️  Change the password after first login.\n');

  await app.close();
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
