const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management';

async function clearClasses() {
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

        // Delete all classes
        const result = await Class.deleteMany({});
        console.log(`\n✅ Deleted ${result.deletedCount} classes from database`);
        console.log('📋 Database is now empty - Admin can add classes from UI\n');

        await mongoose.disconnect();
        console.log('✅ Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing classes:', error);
        process.exit(1);
    }
}

clearClasses();
