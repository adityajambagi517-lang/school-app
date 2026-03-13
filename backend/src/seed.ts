import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './schemas/user.schema';
import { Student } from './schemas/student.schema';
import { Teacher } from './schemas/teacher.schema';
import { Class } from './schemas/class.schema';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const userModel = app.get(getModelToken(User.name)) as Model<User>;
    const studentModel = app.get(getModelToken(Student.name)) as Model<Student>;
    const teacherModel = app.get(getModelToken(Teacher.name)) as Model<Teacher>;
    const classModel = app.get(getModelToken(Class.name)) as Model<Class>;

    console.log('🌱 Starting production database seed...');

    // Clear existing data
    await Promise.all([
        userModel.deleteMany({}),
        studentModel.deleteMany({}),
        teacherModel.deleteMany({}),
        classModel.deleteMany({}),
    ]);

    console.log('✅ Cleared all existing data');

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

    console.log('✅ Created production admin user');
    console.log('\n🎉 Production seed completed successfully!');
    console.log('📝 Login credentials:');
    console.log('   Admin: userId=admin, password=password123');
    console.log('⚠️  IMPORTANT: Please change the admin password after your first login.');
    console.log('\n');

    await app.close();
}

seed()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    });
