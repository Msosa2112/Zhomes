const fs = require('fs');
const path = require('path');

// Comprehensive emoji regex matching all emoji ranges + ZWJ sequences
const emojiRegex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{1fa70}-\u{1faff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{2b50}\u{2b55}\u{23f3}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}\u{1f004}\u{1f0cf}\u{3030}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{24c2}](?:\u{fe0f})?(?:\u{200d}[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{1fa70}-\u{1faff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}](?:\u{fe0f})?)*/gu;

const cleanupRegex = /[\uFE0F\u200D]/g;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    if (emojiRegex.test(content) || cleanupRegex.test(content)) {
        let newContent = content.replace(emojiRegex, '').replace(cleanupRegex, '');
        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            changedFiles++;
        }
    }
});

console.log(`Removed emojis from ${changedFiles} files in /src.`);
