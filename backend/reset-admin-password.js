const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/school-management');
    console.log('Connected to MongoDB');

    // 2. Define the Admin User ID
    const adminUserId = 'admin'; // Change this if your admin ID is different
    const newPassword = 'password123';

    // 3. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update the user in the database
    const result = await mongoose.connection.db.collection('users').updateOne(
      { userId: adminUserId },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount > 0) {
      console.log(`Success! Password for user "${adminUserId}" has been reset to: ${newPassword}`);
    } else {
      console.log(`User "${adminUserId}" not found.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error resetting password:', err);
    process.exit(1);
  }
}

resetAdminPassword();
