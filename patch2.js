const fs = require('fs');
let ctx = fs.readFileSync('src/context/user-data-context.tsx', 'utf8');

// Check if updateLifeEvent is in interface
if (!ctx.includes('updateLifeEvent: (id: string, updates: Partial<LifeEvent>) => Promise<void>;')) {
    // We can replace the exact spot
    const searchStr = 'addLifeEvent: (event: Omit<LifeEvent, \\'id\\' | \\'user_id\\' | \\'created_at\\'>) => Promise<void>;';
    const replaceStr = searchStr + '\\n    updateLifeEvent: (id: string, updates: Partial<LifeEvent>) => Promise<void>;';
    ctx = ctx.replace(searchStr, replaceStr);
    fs.writeFileSync('src/context/user-data-context.tsx', ctx);
    console.log('Added updateLifeEvent to interface.');
} else {
    console.log('Already there.');
}
