const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { MongoStore } = require('wwebjs-mongo');

let client = null;
let latestQR = null;

async function initializeBot() {
    console.log('Initializing WhatsApp bot with MongoDB RemoteAuth...');
    
    // Prevent the ENOENT scandir crash by pre-creating the temp Auth directory manually
    const tempDir = path.join(__dirname, '.wwebjs_auth', 'session-church-bot');
    const defaultTempDir = path.join(__dirname, '.wwebjs_auth', 'wwebjs_temp_session_church-bot', 'Default');
    if (!fs.existsSync(defaultTempDir)) {
        fs.mkdirSync(defaultTempDir, { recursive: true });
    }

    const store = new MongoStore({ mongoose: mongoose });
    
    // Wipe poisoned executable path inherited from Docker image
    delete process.env.PUPPETEER_EXECUTABLE_PATH;

    client = new Client({
        authStrategy: new RemoteAuth({
            clientId: 'church-bot',
            store: store,
            backupSyncIntervalMs: 300000
        }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', (qr) => {
        console.log('QR RECEIVED. Scan the code below with your WhatsApp!');
        latestQR = qr;
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('WhatsApp Client is secretly ready!');
        latestQR = 'CONNECTED';
    });
    
    client.on('remote_session_saved', () => {
        console.log('WhatsApp Session automatically saved to MongoDB Cloud.');
    });

    await client.initialize();
}

async function sendMessageToGroups(groups, textMessage, mediaPath, sendImage) {
    if (!client || !client.info) {
        console.log('Client not ready, cannot send message.');
        return;
    }

    let media = null;
    if (sendImage && fs.existsSync(mediaPath)) {
        media = MessageMedia.fromFilePath(mediaPath);
    }

    const chats = await client.getChats();
    for (const groupName of groups) {
        // Find the group by name (case-insensitive and whitespace-trimmed)
        const targetName = groupName.trim().toLowerCase();
        const groupChat = chats.find(chat => chat.isGroup && chat.name && chat.name.trim().toLowerCase() === targetName);
        
        if (groupChat) {
            console.log(`Sending message to group: ${groupChat.name}`);
            try {
                if (media) {
                    await groupChat.sendMessage(media, { caption: textMessage });
                } else {
                    await groupChat.sendMessage(textMessage);
                }
                console.log(`Successfully sent to ${groupChat.name}`);
            } catch (err) {
                console.error(`Error sending message to ${groupChat.name}:`, err);
            }
        } else {
            console.log(`Group not found: '${groupName}'`);
            // Print out all available group names to help the user debug
            const availableGroups = chats.filter(c => c.isGroup && c.name).map(c => c.name);
            console.log(`\n--- AVAILABLE GROUPS ---`);
            console.log(availableGroups.join(' | '));
            console.log(`------------------------\n`);
        }
    }
}

function getLatestQR() {
    return latestQR;
}

module.exports = {
    client,
    initializeBot,
    sendMessageToGroups,
    getLatestQR
};
