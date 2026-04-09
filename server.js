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

    // Add visual QR endpoint
    app.get('/qr', (req, res) => {
        const { getLatestQR } = require('./bot');
        const qrData = getLatestQR();
        
        if (!qrData) {
            return res.send(`<h2 style="font-family:sans-serif; text-align:center; margin-top:20vh;">Bot is spinning up... Please wait a few seconds and refresh.</h2>`);
        }
        
        if (qrData === 'CONNECTED') {
             return res.send(`<h2 style="font-family:sans-serif; text-align:center; margin-top:20vh; color:green;">Successfully Linked! Close this window.</h2>`);
        }

        const html = `
        <html>
            <head>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="display:flex; justify-content:center; align-items:center; height:100vh; background:#f0f0f0; flex-direction:column; margin:0;">
                <h1 style="font-family:sans-serif; margin-bottom:20px;">Scan to Link WhatsApp</h1>
                <div id="qrcode" style="background:white; padding:20px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.1);"></div>
                <script>
                    new QRCode(document.getElementById("qrcode"), {
                        text: "${qrData}",
                        width: 300,
                        height: 300
                    });
                    setTimeout(() => location.reload(), 15000);
                </script>
            </body>
        </html>
        `;
        res.send(html);
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
