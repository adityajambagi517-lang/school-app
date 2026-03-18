import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Class } from '../schemas/class.schema';
import { Model } from 'mongoose';

async function seedClasses() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const classModel = app.get<Model<Class>>(getModelToken(Class.name));

  console.log('🌱 Seeding classes...');

  // Clear existing classes (optional - comment out if you want to keep existing)
  await classModel.deleteMany({});

  const classes = [];
  const academicYear = '2024-2025';

  // Create classes from 1st to 10th with sections A, B, C
  for (let classNum = 1; classNum <= 10; classNum++) {
    const className =
      classNum === 1
        ? '1st'
        : classNum === 2
          ? '2nd'
          : classNum === 3
            ? '3rd'
            : `${classNum}th`;

    for (const section of ['A', 'B', 'C']) {
      classes.push({
        className: `Class ${classNum}`,
        section: section,
        academicYear: academicYear,
        // classTeacherId will be null initially, assigned later
      });
    }
  }

  const result = await classModel.insertMany(classes);

  console.log(`✅ Created ${result.length} classes successfully!`);
  console.log('Classes created:');
  result.forEach((cls) => {
    console.log(
      `  - ${cls.className} Section ${cls.section} (${cls.academicYear})`,
    );
  });

  await app.close();
  process.exit(0);
}

seedClasses().catch((error) => {
  console.error('❌ Error seeding classes:', error);
  process.exit(1);
});
