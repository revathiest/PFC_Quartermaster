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
  test('uploads file to user folder', async () => {
    const create = jest.fn()
      .mockResolvedValueOnce({ data: { id: 'folder' } })
      .mockResolvedValueOnce({ data: { id: 'file', webViewLink: 'link' } });
    const drive = { files: { create } };

    const res = await uploadScreenshot(drive, 'root', 'user', 'file.png', Buffer.from('img'), 'image/png');

    expect(create).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ id: 'file', webViewLink: 'link' });
  });
});
