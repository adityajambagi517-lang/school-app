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

    console.log('🌱 Starting database seed...');

    // Clear existing data
    await Promise.all([
        userModel.deleteMany({}),
        studentModel.deleteMany({}),
        teacherModel.deleteMany({}),
        classModel.deleteMany({}),
    ]);

    console.log('✅ Cleared existing data');

    // Create Class
    const class10A = await classModel.create({
        className: 'Class 10',
        section: 'A',
        academicYear: '2025-2026',
        isActive: true,
    });

    console.log('✅ Created class: Class 10-A');

    // Create Teacher
    const teacher = await teacherModel.create({
        teacherId: 'TCH001',
        name: 'John Smith',
        assignedClassId: class10A._id,
        subject: 'Mathematics',
        phone: '9876543210',
        email: 'john.teacher@school.com',
        isActive: true,
    });

    // Update class with teacher
    class10A.classTeacherId = teacher._id;
    await class10A.save();

    console.log('✅ Created teacher: John Smith (TCH001)');

    // Create Students
    const students: any[] = [];
    for (let i = 1; i <= 5; i++) {
        const student = await studentModel.create({
            studentId: `STU${String(i).padStart(3, '0')}`,
            name: `Student ${i}`,
            classId: class10A._id,
            dateOfBirth: new Date('2010-01-01'),
            gender: 'Male',
            guardianName: `Parent ${i}`,
            guardianPhone: `98765432${10 + i}`,
            address: `Address ${i}`,
            email: `student${i}@school.com`,
            isActive: true,
        });
        students.push(student);
    }

    console.log('✅ Created 5 students (STU001-STU005)');

    // Create User Accounts
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Admin User
    await userModel.create({
        userId: 'admin',
        password: hashedPassword,
        role: UserRole.ADMIN,
        email: 'admin@school.com',
        name: 'Admin User',
        isActive: true,
    });

    console.log('✅ Created admin user (userId: admin, password: password123)');

    // Teacher User
    await userModel.create({
        userId: 'TCH001',
        password: hashedPassword,
        role: UserRole.TEACHER,
        email: 'john.teacher@school.com',
        name: 'John Smith',
        isActive: true,
        referenceId: teacher._id,
        referenceModel: 'Teacher',
    });

    console.log('✅ Created teacher user (userId: TCH001, password: password123)');

    // Student Users
    for (const student of students) {
        await userModel.create({
            userId: student.studentId,
            password: hashedPassword,
            role: UserRole.STUDENT,
            email: `${student.studentId.toLowerCase()}@school.com`,
            name: student.name,
            isActive: true,
            referenceId: student._id,
            referenceModel: 'Student',
        });
    }

    console.log('✅ Created 5 student users (STU001-STU005, password: password123)');

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('📝 Login credentials:');
    console.log('   Admin:    userId=admin,  password=password123');
    console.log('   Teacher:  userId=TCH001, password=password123');
    console.log('   Student:  userId=STU001, password=password123');
    console.log('\n');

    await app.close();
}

seed()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    });
