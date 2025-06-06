const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../api');
const serverSrc = fs.readFileSync(path.join(apiDir, 'server.js'), 'utf8');

const importRegex = /\{\s*router:\s*(\w+)\s*\}\s*=\s*require\(['"`]\.\/(.+?)['"`]\)/g;
const routerFiles = {};
let m;
while ((m = importRegex.exec(serverSrc))) {
  if (m[1] !== 'docsRouter') {
    routerFiles[m[1]] = `${m[2]}.js`;
  }
}

const useRegex = /app\.use\(['"`]([^'"`]+)['"`],\s*(\w+)\)/g;
const basePaths = {};
while ((m = useRegex.exec(serverSrc))) {
  if (m[2] !== 'docsRouter') {
    basePaths[m[2]] = m[1];
  }
}

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Quartermaster API',
    version: '1.0.0'
  },
  paths: {}
};

const directRegex = /app\.get\(['"`]([^'"`]+)['"`]/g;
while ((m = directRegex.exec(serverSrc))) {
  spec.paths[m[1]] = {
    get: {
      summary: `GET ${m[1]}`,
      responses: { 200: { description: 'Success' } }
    }
  };
}

for (const [routerVar, base] of Object.entries(basePaths)) {
  const file = routerFiles[routerVar];
  if (!file) continue;
  const src = fs.readFileSync(path.join(apiDir, file), 'utf8');
  const routeRegex = /router\.get\(['"`]([^'"`]+)['"`]/g;
  let routeMatch;
  while ((routeMatch = routeRegex.exec(src))) {
    let route = routeMatch[1];
    if (route === '/') route = '';
    spec.paths[`${base}${route}`] = {
      get: {
        summary: `GET ${base}${route}`,
        responses: { 200: { description: 'Success' } }
      }
    };
  }
}

fs.writeFileSync(path.join(apiDir, 'swagger.json'), JSON.stringify(spec, null, 2));
console.log('\uD83D\uDCDD Swagger docs generated'); // 📝
