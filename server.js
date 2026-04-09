const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { getConfig, updateConfig } = require('./db');

// Configure multer to overwrite the poster.jpg
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'media'));
    },
    filename: function (req, file, cb) {
        cb(null, 'poster.jpg');
    }
});
const upload = multer({ storage: storage });

function startServer(reloadScheduler) {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/media', express.static(path.join(__dirname, 'media')));
    
    // Serve React Frontend
    app.use(express.static(path.join(__dirname, 'frontend', 'dist')));
    app.get('/api/config', async (req, res) => {
        try {
            const config = await getConfig();
            res.json(config);
        } catch(e) {
            res.status(500).json({ error: e.message });
        }
    });

    // POST config
    app.post('/api/config', async (req, res) => {
        try {
            const newConfig = req.body;
            await updateConfig({
                groups: newConfig.groups,
                sunday_time: newConfig.sunday_time,
                zoom_link: newConfig.zoom_link,
                send_image: newConfig.send_image
            });
            reloadScheduler();
            res.json({ success: true });
        } catch(e) {
            res.status(500).json({ error: e.message });
        }
    });

    // GET message template
    app.get('/api/message', async (req, res) => {
        try {
            const config = await getConfig();
            res.json({ message: config.message_text || '' });
        } catch(e) {
             res.status(500).json({ error: e.message });
        }
    });

    // POST message template
    app.post('/api/message', async (req, res) => {
        try {
            const { message } = req.body;
            await updateConfig({ message_text: message });
            res.json({ success: true });
        } catch (e) {
             res.status(500).json({ error: e.message });
        }
    });

    // POST media update
    app.post('/api/media', upload.single('poster'), (req, res) => {
        res.json({ success: true });
    });

    // Catch-all route to serve the React app
    app.use((req, res) => {
        res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
    });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`API + React Server running on port ${PORT}`);
    });
    
    return app;
}

module.exports = { startServer };
