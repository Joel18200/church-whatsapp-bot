const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

let client = null;
let latestQR = null;

async function initializeBot() {
    console.log('Initializing WhatsApp bot with LocalAuth...');
    
    // Wipe poisoned executable path inherited from Docker image
    delete process.env.PUPPETEER_EXECUTABLE_PATH;

    client = new Client({
        authStrategy: new LocalAuth({
            clientId: 'church-bot'
        }),
        webVersionCache: {
            type: 'local'
        },
        puppeteer: {
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--mute-audio'
            ]
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
