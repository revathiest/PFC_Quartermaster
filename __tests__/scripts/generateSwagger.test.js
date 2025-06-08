const fs = require('fs');
const path = require('path');

describe('scripts/generateSwagger', () => {
  test('writes security scheme', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.isolateModules(() => {
      require('../../scripts/generateSwagger');
    });
    const specPath = path.join(__dirname, '../../api/swagger.json');
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    expect(spec.components.securitySchemes.bearerAuth).toEqual(
      expect.objectContaining({ type: 'http', scheme: 'bearer' })
    );
    expect(spec.security).toEqual([{ bearerAuth: [] }]);
    logSpy.mockRestore();
  });

  test('captures POST endpoints', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.isolateModules(() => {
      require('../../scripts/generateSwagger');
    });
    const specPath = path.join(__dirname, '../../api/swagger.json');
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    expect(spec.paths['/api/login'].post).toBeDefined();
    logSpy.mockRestore();
  });
});
