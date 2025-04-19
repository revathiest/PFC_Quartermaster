const fs = require('fs');
const path = require('path');

function deleteOldLogs(logDir, days = 7) {
    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    fs.readdir(logDir, (err, files) => {
        if (err) {
            console.error('❌ Failed to read log directory:', err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(logDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.warn(`⚠️ Could not stat file: ${file}`, err);
                    return;
                }

                if (stats.mtimeMs < cutoff) {
                    fs.unlink(filePath, err => {
                        if (err) {
                            console.error(`❌ Failed to delete ${file}`, err);
                        } else {
                            console.log(`🗑️ Deleted old log file: ${file}`);
                        }
                    });
                }
            });
        });
    });
}

module.exports = { deleteOldLogs };
