const fs = require('fs');
const path = require('path');

describe('scripts/generateSwagger', () => {
  test('writes security scheme and security per path', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.isolateModules(() => {
      require('../../scripts/generateSwagger');
    });
    const specPath = path.join(__dirname, '../../api/swagger.json');
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    expect(spec.components.securitySchemes.bearerAuth).toEqual(
      expect.objectContaining({ type: 'http', scheme: 'bearer' })
    );
    expect(spec.paths['/api/profile/{userId}'].get.security).toEqual([
      { bearerAuth: [] }
    ]);
    expect(spec.paths['/api/data'].get.security).toBeUndefined();
    logSpy.mockRestore();
  });

  test('captures POST endpoints and request bodies', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.isolateModules(() => {
      require('../../scripts/generateSwagger');
    });
    const specPath = path.join(__dirname, '../../api/swagger.json');
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    expect(spec.paths['/api/login'].post).toBeDefined();
    expect(spec.paths['/api/login'].post.requestBody).toBeDefined();
    expect(spec.paths['/api/content/{section}'].put.requestBody).toBeDefined();
    logSpy.mockRestore();
  });
});
