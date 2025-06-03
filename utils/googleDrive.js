const { google } = require('googleapis');

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

/**
 * Create an authenticated Google Drive client using a service account key.
 * The path to the key file is read from the environment variable
 * `GOOGLE_SERVICE_ACCOUNT_FILE` (or `GOOGLE_APPLICATION_CREDENTIALS`).
 */
async function createDriveClient() {
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyFile) {
    throw new Error('Service account key file not specified. Set GOOGLE_SERVICE_ACCOUNT_FILE');
  }

  const auth = new google.auth.GoogleAuth({ keyFile, scopes: [DRIVE_SCOPE] });
  const authClient = await auth.getClient();
  return google.drive({ version: 'v3', auth: authClient });
}

async function uploadScreenshot(drive, rootFolderId, userFolderName, fileName, fileBuffer, mimeType) {
  const folderRes = await drive.files.create({
    resource: { name: userFolderName, mimeType: 'application/vnd.google-apps.folder', parents: [rootFolderId] },
    fields: 'id'
  });
  const folderId = folderRes.data.id;
  const fileRes = await drive.files.create({
    resource: { name: fileName, parents: [folderId] },
    media: { mimeType, body: fileBuffer },
    fields: 'id, webViewLink'
  });
  return fileRes.data;
}

module.exports = { createDriveClient, uploadScreenshot };
