const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect('mongodb://127.0.0.1:27017/school-management');
  const db = mongoose.connection.db;
  
  const collections = await db.listCollections().toArray();
  for (const coll of collections) {
      const collection = db.collection(coll.name);
      const docs = await collection.find({}).toArray();
      let updated = 0;
      
      for (const doc of docs) {
          let hasUpdates = false;
          const update = { $set: {} };
          
          for (const key of Object.keys(doc)) {
              if (key === '_id' || key === '__v') continue;
              
              const val = doc[key];
              // Convert exact 24-char hex strings that look like ObjectIds to ObjectId
              if (typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val)) {
                  update.$set[key] = new mongoose.Types.ObjectId(val);
                  hasUpdates = true;
              } else if (Array.isArray(val)) {
                  let arrayChanged = false;
                  const newArray = val.map(item => {
                      if (typeof item === 'string' && /^[0-9a-fA-F]{24}$/.test(item)) {
                          arrayChanged = true;
                          return new mongoose.Types.ObjectId(item);
                      }
                      return item;
                  });
                  if (arrayChanged) {
                      update.$set[key] = newArray;
                      hasUpdates = true;
                  }
              }
          }
          
          if (hasUpdates) {
             await collection.updateOne({ _id: doc._id }, update);
             updated++;
          }
      }
      console.log(`Migrated ${updated} docs in ${coll.name}`);
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(console.error);
