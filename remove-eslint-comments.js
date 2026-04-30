const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function(err, list) {
        if (err) return callback(err);
        let pending = list.length;
        if (!pending) return callback(null);
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        if (!--pending) callback(null);
                    });
                } else {
                    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                        let content = fs.readFileSync(file, 'utf8');
                        if (content.includes('// eslint-disable-next-line react/no-unescaped-entities')) {
                            // Replace exactly that line, including potential leading/trailing spaces
                            const regex = /^[ \t]*\/\/ eslint-disable-next-line react\/no-unescaped-entities[ \t]*\r?\n/gm;
                            const regexInline = /\/\/ eslint-disable-next-line react\/no-unescaped-entities/g;
                            let newContent = content.replace(regex, '');
                            // Just in case it's inline or doesn't end with a newline
                            newContent = newContent.replace(regexInline, '');
                            
                            if (content !== newContent) {
                                fs.writeFileSync(file, newContent, 'utf8');
                                console.log(`Cleaned ${file}`);
                            }
                        }
                    }
                    if (!--pending) callback(null);
                }
            });
        });
    });
}

walk('./src', function(err) {
    if (err) throw err;
    console.log('Done scanning and cleaning src directory.');
});
