const mongoose = require('mongoose');
const { Schema } = mongoose;
const fs = require('fs');

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/school-management');

        const TeacherSchema = new Schema({
            name: String,
            teacherId: String,
            assignedClassId: { type: Schema.Types.ObjectId, ref: 'Class' }
        });
        const UserSchema = new Schema({
            userId: String,
            name: String,
            role: String,
            referenceId: Schema.Types.ObjectId
        });
        const ClassSchema = new Schema({
            className: String,
            section: String,
            academicYear: String
        });

        const Teacher = mongoose.model('Teacher', TeacherSchema);
        const User = mongoose.model('User', UserSchema);
        const Class = mongoose.model('Class', ClassSchema);

        const teachers = await Teacher.find().lean();
        const users = await User.find({ role: 'teacher' }).lean();
        const classes = await Class.find().lean();

        const data = {
            classes,
            teachers: teachers.map(t => ({
                name: t.name,
                teacherId: t.teacherId,
                dbId: t._id,
                assignedClassId: t.assignedClassId
            })),
            users: users.map(u => ({
                userId: u.userId,
                name: u.name,
                refId: u.referenceId
            }))
        };

        fs.writeFileSync('debug_data.json', JSON.stringify(data, null, 2));
        console.log('Data written to debug_data.json');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
