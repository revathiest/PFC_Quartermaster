const { createDriveClient } = require('../../utils/googleDrive');
const { google } = require('googleapis');

jest.mock('googleapis');

const mockGetClient = jest.fn();
const mockGoogleAuth = jest.fn(() => ({ getClient: mockGetClient }));
const mockDrive = jest.fn();

google.auth = { GoogleAuth: mockGoogleAuth };
google.drive = mockDrive;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GOOGLE_SERVICE_ACCOUNT_FILE = '/path/key.json';
  mockGetClient.mockResolvedValue('client');
  mockDrive.mockReturnValue('drive');
});

afterEach(() => {
  delete process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
});

test('throws if key file env var is missing', async () => {
  delete process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  await expect(createDriveClient()).rejects.toThrow('Service account key file not specified');
});

test('creates drive client using service account key', async () => {
  const drive = await createDriveClient();

  expect(mockGoogleAuth).toHaveBeenCalledWith({
    keyFile: '/path/key.json',
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  expect(mockGetClient).toHaveBeenCalled();
  expect(mockDrive).toHaveBeenCalledWith({ version: 'v3', auth: 'client' });
  expect(drive).toBe('drive');
});
const { uploadScreenshot } = require('../../utils/googleDrive');

describe('uploadScreenshot', () => {
  test('creates user folder when missing', async () => {
    const list = jest.fn().mockResolvedValue({ data: { files: [] } });
    const create = jest.fn()
      .mockResolvedValueOnce({ data: { id: 'folder' } })
      .mockResolvedValueOnce({ data: { id: 'file', webViewLink: 'link' } });
    const drive = { files: { list, create } };

    const res = await uploadScreenshot(drive, 'root', 'user', 'file.png', Buffer.from('img'), 'image/png');

    expect(list).toHaveBeenCalledWith(expect.objectContaining({
      q: expect.stringContaining("'root' in parents"),
    }));
    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      resource: expect.objectContaining({ name: 'user' })
    }));
    expect(res).toEqual({ id: 'file', webViewLink: 'link' });
  });

  test('reuses existing user folder', async () => {
    const list = jest.fn().mockResolvedValue({ data: { files: [{ id: 'folder' }] } });
    const create = jest.fn().mockResolvedValueOnce({ data: { id: 'file', webViewLink: 'link' } });
    const drive = { files: { list, create } };

    const res = await uploadScreenshot(drive, 'root', 'user', 'file.png', Buffer.from('img'), 'image/png');

    expect(list).toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      resource: expect.objectContaining({ name: 'file.png', parents: ['folder'] })
    }));
    expect(res).toEqual({ id: 'file', webViewLink: 'link' });
  });
});
