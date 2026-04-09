const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const { sendMessageToGroups } = require('./bot');
const { getConfig } = require('./db');

let scheduledJob = null;

function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

async function executeJob() {
    console.log('Executing automated WhatsApp message job...');
    const config = await getConfig();
    let messageText = config.message_text || '';

    // Replace placeholders
    const todayStr = formatDate(new Date());
    messageText = messageText.replace(/\{\{date\}\}/g, todayStr);
    messageText = messageText.replace(/\{\{zoom_link\}\}/g, config.zoom_link);

    const mediaPath = path.join(__dirname, 'media', 'poster.jpg');

    sendMessageToGroups(config.groups, messageText, mediaPath, config.send_image);
}

function parseCron(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return '0 8 * * 0';
    if (timeStr.split(' ').length >= 5) return timeStr;
    let parts = timeStr.split(':');
    let hours = parseInt(parts[0]) || 8;
    let mins = parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
    return `${mins} ${hours} * * 0`;
}

async function startScheduler() {
    const config = await getConfig();
    if (scheduledJob) {
        scheduledJob.stop();
    }
    const safeCron = parseCron(config.sunday_time);
    console.log(`Scheduling job with cron: ${safeCron}`);
    scheduledJob = cron.schedule(safeCron, () => {
        executeJob();
    });
}

function reloadScheduler() {
    console.log('Reloading scheduler...');
    startScheduler();
}

module.exports = {
    startScheduler,
    reloadScheduler,
    executeJob
};
