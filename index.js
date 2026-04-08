const { initializeBot } = require('./bot');
const { startScheduler, reloadScheduler, executeJob } = require('./scheduler');
const { startServer } = require('./server');

const { connectDB } = require('./db');

console.log('Starting Church WhatsApp Automation System...');

async function run() {
    await connectDB();
    
    // 1. Initialize API Server
    startServer(reloadScheduler);
    
    // 2. Initialize Node-Cron Scheduler
    startScheduler();
    
    // 3. Initialize WhatsApp Bot
    initializeBot();
}

run();
