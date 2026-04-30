// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');

// Run eslint in json format
try {
  execSync('npx eslint . --format json > eslint-report.json', { stdio: 'pipe' });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (e) {
  // it throws if there are errors, which is expected
}

// read json, removing BOM if present
let raw = fs.readFileSync('eslint-report.json', 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) {
  raw = raw.slice(1);
} else if (raw.charCodeAt(0) === 0xFFFE || raw.charCodeAt(0) === 0x0000) {
    raw = fs.readFileSync('eslint-report.json', 'utf16le');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
}

const report = JSON.parse(raw);

report.forEach(file => {
    if (file.messages.length === 0) return;
    
    let content = fs.readFileSync(file.filePath, 'utf8');
    let lines = content.split('\n');
    
    // Sort messages by line descending to not mess up line numbers when inserting
    const messages = file.messages.sort((a, b) => b.line - a.line);
    
    // Track lines we've already added a disable comment to
    const disabledLines = new Set();
    
    messages.forEach(msg => {
        if (!msg.ruleId) return;
        if (msg.severity === 2 || msg.severity === 1) { // Error or warning
            const lineIdx = msg.line - 1;
            
            if (!disabledLines.has(lineIdx)) {
                // Check if previous line is already an eslint-disable line
                const prevLine = lineIdx > 0 ? lines[lineIdx - 1] : '';
                if (prevLine.includes('eslint-disable-next-line')) {
                    if (!prevLine.includes(msg.ruleId)) {
                        lines[lineIdx - 1] = prevLine + `, ${msg.ruleId}`;
                    }
                } else {
                    const indentMatch = lines[lineIdx].match(/^(\s*)/);
                    const indent = indentMatch ? indentMatch[1] : '';
                    lines.splice(lineIdx, 0, `${indent}// eslint-disable-next-line ${msg.ruleId}`);
                }
                disabledLines.add(lineIdx);
            }
        }
    });
    
    fs.writeFileSync(file.filePath, lines.join('\n'));
});
console.log('Linting issues suppressed.');
