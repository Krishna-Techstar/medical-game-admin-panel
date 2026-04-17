const fs = require('fs');
const path = require('path');

const dir = './src/components/ui';

fs.readdirSync(dir)
  .filter(f => f.endsWith('.tsx'))
  .forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove version specifiers from imports (e.g., @1.2.3 -> nothing)
    content = content.replace(/"([^"]*?)@[\d.]+"/g, '"$1"');
    content = content.replace(/'([^']*?)@[\d.]+'/g, "'$1'");
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated ${file}`);
    }
  });

console.log('Done!');
