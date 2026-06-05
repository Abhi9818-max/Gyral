const fs = require('fs');

function fixFile(path, replaceFn) {
    if (fs.existsSync(path)) {
        let content = fs.readFileSync(path, 'utf8');
        content = replaceFn(content);
        fs.writeFileSync(path, content);
        console.log(`Fixed ${path}`);
    } else {
        console.log(`File not found: ${path}`);
    }
}

// 1. faction-picker-modal.tsx
fixFile('src/components/modals/faction-picker-modal.tsx', (content) => {
    content = content.replaceAll('// eslint-disable-next-line react-hooks/purity', '{/* eslint-disable-next-line react-hooks/purity */}');
    content = content.replaceAll('// eslint-disable-next-line @next/next/no-img-element', '{/* eslint-disable-next-line @next/next/no-img-element */}');
    content = content.replaceAll('<Leaf size={16 + Math.random() * 10} />', '<Leaf size={20} />');
    return content;
});

// 2. friend-requests-modal.tsx
fixFile('src/components/modals/friend-requests-modal.tsx', (content) => {
    content = content.replaceAll('// eslint-disable-next-line @next/next/no-img-element', '{/* eslint-disable-next-line @next/next/no-img-element */}');
    return content;
});

// 3. search-modal.tsx
fixFile('src/components/modals/search-modal.tsx', (content) => {
    content = content.replaceAll('// eslint-disable-next-line @next/next/no-img-element', '{/* eslint-disable-next-line @next/next/no-img-element */}');
    return content;
});

// 4. recommended-reel.tsx
fixFile('src/components/world/recommended-reel.tsx', (content) => {
    content = content.replaceAll('// eslint-disable-next-line @next/next/no-img-element', '{/* eslint-disable-next-line @next/next/no-img-element */}');
    return content;
});

// 5. world-feed-card.tsx
fixFile('src/components/world/world-feed-card.tsx', (content) => {
    content = content.replaceAll('// eslint-disable-next-line @next/next/no-img-element', '{/* eslint-disable-next-line @next/next/no-img-element */}');
    return content;
});

// 6. usePresence.ts
fixFile('src/hooks/usePresence.ts', (content) => {
    content = content.replaceAll('(payload: any)', '(payload: unknown)');
    return content;
});

console.log('Lint fixing script finished.');
