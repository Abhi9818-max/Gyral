const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

if (!css.includes('@keyframes shimmer')) {
    css += `\n
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
`;
    fs.writeFileSync('src/app/globals.css', css);
    console.log('Added shimmer keyframe.');
} else {
    console.log('Shimmer already exists.');
}
