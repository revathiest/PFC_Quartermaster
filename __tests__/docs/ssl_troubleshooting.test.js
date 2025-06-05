const fs = require('fs');
const path = require('path');

describe('SSL troubleshooting documentation', () => {
  let content;
  let readme;

  beforeAll(() => {
    const docPath = path.join(__dirname, '../../docs/ssl_troubleshooting.md');
    content = fs.readFileSync(docPath, 'utf8');
    const readmePath = path.join(__dirname, '../../README.md');
    readme = fs.readFileSync(readmePath, 'utf8');
  });

  test('lists common ACME failure causes', () => {
    expect(content).toContain('Port **80** blocked by a firewall or already in use');
    expect(content).toContain('Domain DNS records pointing to the wrong IP');
    expect(content).toContain('A redirect or proxy preventing access to `/.well-known/acme-challenge/*`');
  });

  test('README links to troubleshooting guide', () => {
    expect(readme).toContain('docs/ssl_troubleshooting.md');
  });
});
