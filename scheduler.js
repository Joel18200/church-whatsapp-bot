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

async function startScheduler() {
    const config = await getConfig();
    if (scheduledJob) {
        scheduledJob.stop();
    }
    console.log(`Scheduling job with cron: ${config.sunday_time}`);
    scheduledJob = cron.schedule(config.sunday_time || '* * * * *', () => {
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
