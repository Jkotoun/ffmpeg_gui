const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');

const ffmpegPath = require('ffmpeg-static-electron').path;
const ffprobePath = require('ffprobe-static').path;
let ffmpegProcess = undefined;

function regexMatchedTimeToSeconds(regexmatch) {
    const hours = parseInt(regexmatch[1], 10);
    const minutes = parseInt(regexmatch[2], 10);
    const seconds = parseInt(regexmatch[3], 10);
    const totalSeconds = seconds + minutes * 60 + hours * 60 * 60;
    return totalSeconds;
}

function getProgress(data, duration) {
    const progressRegex = /time=(\d{2}):(\d{2}):(\d{2}).(\d{2})/;
    const match = data.match(progressRegex);

    if (match && duration) {
        let exportedSeconds = regexMatchedTimeToSeconds(match);
        return ((exportedSeconds / duration) * 100).toFixed(2);
    }
    return undefined;
}

async function getMediaInfo(event, filePath) {
    return new Promise((resolve, reject) => {
        const ffprobeProcess = spawn(ffprobePath, [
            '-v',
            'quiet',
            '-print_format',
            'json',
            '-show_format',
            '-show_streams',
            filePath,
        ]);

        let dataBuffer = Buffer.alloc(0);

        ffprobeProcess.stdout.on('data', (chunk) => {
            dataBuffer = Buffer.concat([dataBuffer, chunk]);
        });

        ffprobeProcess.on('error', (err) => {
            reject(err);
        });

        ffprobeProcess.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`ffprobe exited with code ${code}`));
            } else {
                try {
                    const dataString = dataBuffer.toString('utf8');
                    const mediaInfo = JSON.parse(dataString);
                    resolve(mediaInfo);
                } catch (err) {
                    reject(err);
                }
            }
        });
    });
}

async function handleVideoExport(
    event,
    inputFilePath,
    outputFilePath,
    videoCodec,
    audioCodec,
    videoBitrate,
    audioBitrate,
    audioSampleRate,
    audioChannels,
    preset,
    resolution,
    framerate,
    offset,
    duration,
    metadata
) {
    ffmpegProcess = spawn(ffmpegPath, [
        '-i',
        inputFilePath,
        '-ss',
        offset,
        '-t',
        duration,
        '-c:v',
        videoCodec,
        '-b:v',
        videoBitrate,
        '-c:a',
        audioCodec,
        '-b:a',
        audioBitrate,
        '-ar',
        audioSampleRate,
        '-ac',
        audioChannels,
        '-preset',
        preset,
        '-r',
        framerate,
        '-s',
        resolution,
        ...metadata.map((m) => ['-metadata', `${m.key}=${m.value}`]).flat(),
        '-y',
        outputFilePath,
    ]);

    ffmpegProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });



    //report exporting progress
    ffmpegProcess.stderr.on('data', (data) => {
        const progress = getProgress(data.toString(), duration);
        if (progress) {
            console.log(`Conversion progress: ${progress}%`);
            event.sender.send('exportProgress', progress);
        }
        // }
    });
    ffmpegProcess.on('exit', (_) => (ffmpegProcess = undefined));

    return new Promise((resolve, reject) => {
        ffmpegProcess.on('error', (err) => {
            reject(err);
        });

        ffmpegProcess.on('exit', (code) => {
            if (code === 0) {
                resolve(0);
            } else {
                if (code) {
                    reject(
                        new Error(`ffmpeg process exited with code ${code}`)
                    );
                }
                //no code, process was killed
                else {
                    resolve(-1);
                }
            }
        });
    });
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
    });

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

//methods for native feel of app on different platforms

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

async function handleFileOpen() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile', 'singleSelection'],
    });
    if (!canceled) {
        return filePaths[0];
    }
}

async function handleFileSave() {
    const { canceled, filePath } = await dialog.showSaveDialog();
    if (!canceled) {
        return filePath;
    }
}

app.whenReady().then(() => {
    ipcMain.handle('dialog:openFile', handleFileOpen);
    ipcMain.handle('dialog:saveFile', handleFileSave);
    ipcMain.handle('exportVideo', handleVideoExport);
    ipcMain.handle('cancelExporting', () => {
        if (ffmpegProcess) {
            ffmpegProcess.kill();
        }
    });
    ipcMain.handle('getMediaInfo', getMediaInfo);

    createWindow();
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});
