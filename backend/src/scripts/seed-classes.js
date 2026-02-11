const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management';

async function seedClasses() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const ClassSchema = new mongoose.Schema({
            className: String,
            section: String,
            academicYear: String,
            classTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
        });

        const Class = mongoose.model('Class', ClassSchema);

        // Clear existing classes
        await Class.deleteMany({});
        console.log('🗑️  Cleared existing classes');

        const classes = [];
        const academicYear = '2024-2025';

        // Create classes from 1st to 10th with sections A, B, C
        for (let classNum = 1; classNum <= 10; classNum++) {
            for (const section of ['A', 'B', 'C']) {
                classes.push({
                    className: `Class ${classNum}`,
                    section: section,
                    academicYear: academicYear,
                });
            }
        }

        const result = await Class.insertMany(classes);
        console.log(`\n✅ Created ${result.length} classes successfully!\n`);
        console.log('Classes created:');
        result.forEach((cls, index) => {
            if (index % 3 === 0) console.log(''); // New line every 3 classes
            console.log(`  ${cls.className} - Section ${cls.section}`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Database seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding classes:', error);
        process.exit(1);
    }
}

seedClasses();
