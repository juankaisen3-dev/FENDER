const app = require('./app');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

// S'assurer que les dossiers nécessaires existent
const downloadsDir = path.join(__dirname, '..', '..', 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Serveur FENDER [Mode Structuré] lancé sur http://localhost:${PORT}`);
    console.log(`📁 Dossier vidéos: ${downloadsDir}\n`);
});
