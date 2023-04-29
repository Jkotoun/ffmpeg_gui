// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const {contextBridge, ipcRenderer} = require('electron');
const child_process = require('child_process');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
contextBridge.exposeInMainWorld('ffmpeg', ffmpeg);
contextBridge.exposeInMainWorld('process', child_process);


contextBridge.exposeInMainWorld("ipcRenderer", { ...ipcRenderer, on: ipcRenderer.on });
contextBridge.exposeInMainWorld('ffmpegConvert', (input, output) => {
    
    return child_process.spawn(ffmpeg.path,  ['-i', input, output], {detached: true, stdio: 'inherit'})
    

    // command_result.stdout.on('data', (data) => {
    //         console.log(`stdout: ${data}`);
    //       });
    // // command_result.on('data', (data) => {
    // //     const progress = getProgress(data.toString());
    // //     console.log(`Conversion progress: ${progress}%`);
    // //   });
      
    // command_result.on('close', (code) => {
    //     console.log("sending")
    //     ipcRenderer.send('ffmpeg-convert-result', code)
    // })
})

function getProgress(data) {
    const progressRegex = /time=(\d{2}):(\d{2}):(\d{2}).(\d{2})/;
    const match = data.match(progressRegex);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const seconds = parseInt(match[3], 10);
      const milliseconds = parseInt(match[4], 10) * 10;
      const totalSeconds = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
      const progress = (totalSeconds / duration) * 100;
      return progress.toFixed(2);
    }
    return 0;
  }

// contextBridge.exposeInMainWorld('electronAPI', {
//     runffmpeg: (args) => spawn(ffmpeg, args)
//   })