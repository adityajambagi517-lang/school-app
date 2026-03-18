const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/school-management');
  const db = mongoose.connection.db;
  
  const classDoc = await db.collection('classes').findOne();
  if(classDoc) {
      console.log('classTeacherId in classes:', classDoc.classTeacherId ? classDoc.classTeacherId.constructor.name : 'null');
  }

  const teacherDoc = await db.collection('teachers').findOne();
  if(teacherDoc) {
      console.log('assignedClassId in teachers:', teacherDoc.assignedClassId ? teacherDoc.assignedClassId.constructor.name : 'null');
      console.log('teacher._id type:', teacherDoc._id.constructor.name);
  }

  const studentDoc = await db.collection('students').findOne();
  if(studentDoc) {
      console.log('classId in students:', studentDoc.classId ? studentDoc.classId.constructor.name : 'null');
  }

  process.exit(0);
}

check().catch(console.error);
