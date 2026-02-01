const fs = require('fs');
// Using forward slashes for safety in Node
const src = 'C:/Users/Aman/.gemini/antigravity/brain/85ed1ba8-90c0-4be5-a16e-4853e968f705/gyral_app_icon_1769940171503.png';
const dest1 = 'public/icons/icon-192.png';
const dest2 = 'public/icons/icon-512.png';

try {
    if (!fs.existsSync('public/icons')) fs.mkdirSync('public/icons', { recursive: true });
    fs.copyFileSync(src, dest1);
    fs.copyFileSync(src, dest2);
    console.log('Icons copied successfully.');
} catch (e) {
    console.error('Error copying icons:', e);
}
