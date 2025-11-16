//utils/index-music.js
const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');

const musicDataPath = path.join(__dirname, "..", 'musicData');


const findMusicFiles = async (folderPath) => {

    try {
        console.log('folderPath--',folderPath);
        
        const files = await fs.promises.readdir(folderPath);
        const wavFiles = files.filter(file =>
            ['.wav', '.mp3'].includes(path.extname(file).toLowerCase())
          );
       // const wavFiles = files.filter(file => path.extname(file).toLowerCase() === '.wav');

        const musicInfoPromises = wavFiles.map(async (filename, index) => {
            const filePath = path.join(folderPath, filename);
            const metadata = await mm.parseFile(filePath);
            
            return {
                id: index,
                musicName: filename,
                coverName: filename.replace('.mp3', '_cover.png'),
                authorName: filename.substring(0, filename.indexOf('-') - 1),
                trackName: filename.substring(filename.indexOf('-') + 2, filename.lastIndexOf('.mp3')),
                duration: Math.round(metadata.format.duration)
            };

        });

        return Promise.all(musicInfoPromises);
    } catch (error) {
        console.error('reading music names err:', error);
    }
};


findMusicFiles(musicDataPath)
    .then(musicInfo => {
        console.log('Music info:', musicInfo);

        fs.writeFile('musicData.json', JSON.stringify(musicInfo, null, 2), (err) => {
            if (err) {
                console.error('Error when saving music data:', err);
            } else {
                console.log('Music data saved to file musicData.json');
            }
        });
    })
    .catch(error => {
        console.error('error:', error);
    });