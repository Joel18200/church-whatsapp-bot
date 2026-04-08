const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://samuelpappy00_db_user:03wvUE8EEEmDheiG@church-automation-db.oq1wedz.mongodb.net/church_bot?retryWrites=true&w=majority';

const configSchema = new mongoose.Schema({
    id: { type: String, default: 'main' },
    groups: [String],
    sunday_time: { type: String, default: '* * * * *' },
    zoom_link: { type: String, default: '' },
    send_image: { type: Boolean, default: true },
    message_text: { type: String, default: 'hello guys njn aahn chulll the one and only thirunavanathapurathe appi kutty' }
});

const ConfigModel = mongoose.model('Config', configSchema);

async function connectDB() {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected successfully!');
    
    // Seed default config if none exists
    const count = await ConfigModel.countDocuments();
    if (count === 0) {
       await ConfigModel.create({
          id: 'main',
          groups: [],
          message_text: "hello guys njn aahn chulll the one and only thirunavanathapurathe appi kutty",
          sunday_time: "* * * * *",
          zoom_link: "https://zoom.us/j/1234567890?pwd=abc",
          send_image: true
       });
       console.log('MongoDB initialized with default config!');
    }
}

async function getConfig() {
    const conf = await ConfigModel.findOne({ id: 'main' });
    return conf;
}

async function updateConfig(newConfigData) {
    await ConfigModel.findOneAndUpdate({ id: 'main' }, newConfigData, { upsert: true });
}

module.exports = { 
    MONGODB_URI, 
    connectDB, 
    ConfigModel,
    getConfig,
    updateConfig
};
