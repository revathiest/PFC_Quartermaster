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
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {}
};

function buildPathDetails(path) {
  const params = [];
  const openPath = path.replace(/:([^/]+)/g, (_, name) => {
    params.push(name);
    return `{${name}}`;
  });
  const operation = {
    summary: `GET ${openPath}`,
    responses: { 200: { description: 'Success' } }
  };
  if (params.length) {
    operation.parameters = params.map(p => ({
      name: p,
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: `The ${p}`
    }));
  }
  return { openPath, operation };
}

const directRegex = /app\.get\(['"`]([^'"`]+)['"`]/g;
while ((m = directRegex.exec(serverSrc))) {
  const { openPath, operation } = buildPathDetails(m[1]);
  spec.paths[openPath] = { get: operation };
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
    const { openPath, operation } = buildPathDetails(`${base}${route}`);
    spec.paths[openPath] = { get: operation };
  }
}

fs.writeFileSync(path.join(apiDir, 'swagger.json'), JSON.stringify(spec, null, 2));
console.log('\uD83D\uDCDD Swagger docs generated'); // 📝
