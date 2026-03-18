const fs = require('fs');
const path = require('path');

const schemasDir = path.join(__dirname, 'src', 'schemas');

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace the types
    if (content.includes('type: Types.ObjectId')) {
        content = content.replace(/type: Types\.ObjectId/g, 'type: mongoose.Schema.Types.ObjectId');
        changed = true;
    }

    // Add import if missing and changed
    if (changed && !content.includes("import * as mongoose from 'mongoose'")) {
        // Insert after imports
        content = content.replace(/import { Document, Types } from 'mongoose';/, "import { Document, Types } from 'mongoose';\nimport * as mongoose from 'mongoose';");
        // Or if it's different:
        if (!content.includes("import * as mongoose from 'mongoose'")) {
            content = "import * as mongoose from 'mongoose';\n" + content;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${path.basename(filePath)}`);
    }
}

fs.readdirSync(schemasDir).forEach(file => {
    if (file.endsWith('.ts')) {
        updateFile(path.join(schemasDir, file));
    }
});
