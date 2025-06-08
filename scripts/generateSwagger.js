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

function buildPathDetails(path, method = 'get') {
  const params = [];
  const openPath = path.replace(/:([^/]+)/g, (_, name) => {
    params.push(name);
    return `{${name}}`;
  });
  const operation = {
    summary: `${method.toUpperCase()} ${openPath}`,
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

const methods = ['get', 'post', 'put', 'patch', 'delete'];
const directPattern = 'app\\.(' + methods.join('|') + ')\\([\'"\\`]([^\'"\\`]+)[\'"\\`]';
const directRegex = new RegExp(directPattern, 'g');
while ((m = directRegex.exec(serverSrc))) {
  const method = m[1];
  const { openPath, operation } = buildPathDetails(m[2], method);
  if (!spec.paths[openPath]) spec.paths[openPath] = {};
  spec.paths[openPath][method] = operation;
}

for (const [routerVar, base] of Object.entries(basePaths)) {
  const file = routerFiles[routerVar];
  if (!file) continue;
  const src = fs.readFileSync(path.join(apiDir, file), 'utf8');
  const routePattern = 'router\\.(' + methods.join('|') + ')\\([\'"\\`]([^\'"\\`]+)[\'"\\`]';
  const routeRegex = new RegExp(routePattern, 'g');
  let routeMatch;
  while ((routeMatch = routeRegex.exec(src))) {
    const method = routeMatch[1];
    let route = routeMatch[2];
    if (route === '/') route = '';
    const { openPath, operation } = buildPathDetails(`${base}${route}`, method);
    if (!spec.paths[openPath]) spec.paths[openPath] = {};
    spec.paths[openPath][method] = operation;
  }
}

// Paths that should be publicly accessible (no auth required)
const publicPaths = [
  '/api/data',
  '/api/content',
  '/api/content/{section}',
  '/api/events',
  '/api/events/{id}',
  '/api/accolades',
  '/api/accolades/{id}',
  '/api/login'
];

for (const pathKey of publicPaths) {
  if (spec.paths[pathKey]) {
    for (const method of Object.keys(spec.paths[pathKey])) {
      spec.paths[pathKey][method].security = [];
    }
  }
}

// Add detailed docs for log search endpoints
if (spec.paths['/api/activity-log/search']) {
  const logSearch = spec.paths['/api/activity-log/search'];

  if (logSearch.get) {
    logSearch.get.parameters = [
      { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 }, description: 'Page number' },
      { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 25 }, description: 'Results per page' },
      { name: 'type', in: 'query', required: false, schema: { type: 'string' }, description: 'Filter by event type' },
      { name: 'userId', in: 'query', required: false, schema: { type: 'string' }, description: 'Filter by user ID' },
      { name: 'command', in: 'query', required: false, schema: { type: 'string' }, description: 'Filter by command name' },
      { name: 'message', in: 'query', required: false, schema: { type: 'string' }, description: 'Search within message content' }
    ];
  }

  if (logSearch.post) {
    logSearch.post.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              page: { type: 'integer', default: 1 },
              limit: { type: 'integer', default: 25 },
              filters: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  userId: { type: 'string' },
                  command: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    };
  }
}

fs.writeFileSync(path.join(apiDir, 'swagger.json'), JSON.stringify(spec, null, 2));
console.log('\uD83D\uDCDD Swagger docs generated'); // 📝
