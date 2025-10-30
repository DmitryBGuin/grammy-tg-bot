import fs from 'fs';
import path from 'path';

// Функция для добавления расширения .js к ES-импортам в скомпилированных JS-файлах
function addJSExtensionToImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Регулярное выражение для поиска ES-импортов, которые ссылаются на локальные файлы
  // Но не трогаем импорты встроенных модулей или node_modules
  const updatedContent = content
    // Заменяем .js на .js (по сути, исправляем ситуации, где .js был добавлен к уже существующему .js)
    .replace(/(\bfrom\s+["']\.\/[^"']*?)\.js\.js["']/g, '$1.js"')
    .replace(/(\bimport\s+["']\.\/[^"']*?)\.js\.js["']/g, '$1.js"')
    // Заменяем импорты файлов с расширением .ts на .js
    .replace(/(\bfrom\s+["']\.\/[^"']*?)\.ts["']/g, '$1.js"')
    .replace(/(\bimport\s+["']\.\/[^"']*?)\.ts["']/g, '$1.js"')
    // Затем добавляем .js к файлам без расширения
    .replace(/(\bfrom\s+["']\.\/[^"']*?)(?!\.(js|ts|tsx|jsx)["'])["']/g, '$1.js"')
    .replace(/(\bimport\s+["']\.\/[^"']*?)(?!\.(js|ts|tsx|jsx)["'])["']/g, '$1.js"');

  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Fixed imports in: ${filePath}`);
  }
}

// Рекурсивная функция для обработки всех JS-файлов в директории
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      processDirectory(itemPath);
    } else if (item.endsWith('.js') && !item.endsWith('.d.ts.js')) {
      addJSExtensionToImports(itemPath);
    }
  }
}

// Запускаем обработку для директории dist
const distDir = './dist';
if (fs.existsSync(distDir)) {
  console.log('Processing compiled files in dist directory...');
  processDirectory(distDir);
  console.log('Import fixing completed.');
} else {
  console.error('dist directory does not exist. Please run tsc first.');
  process.exit(1);
}