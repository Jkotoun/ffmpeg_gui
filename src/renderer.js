
import './index.css';

// window.Electron.ipcRenderer.send


// window.ElectronelectronAPI.runffmpeg(["-i", "nechapu1.mp4", "nechapu2.mp4"])

// window.Electron.exposeInMainWorld.on('command-result', (event, stdout, stderr, code) => {
//   console.log(`stdout: ${stdout}`);
//   console.error(`stderr: ${stderr}`);
//   console.log(`child process exited with code ${code}`);
// });

// const command_result = child_process.spawn('ffmpeg', ["-i", "nechapu1.mp4", "nechapu1.avi"]);
// // console.log("konec")

// const process = require('child_process');

const {ffmpegConvert, ipcRenderer} = window;

//event listener for button with convert id
document.getElementById('convert').addEventListener('click', () => {
   
      
    let commandResult = ffmpegConvert('nechapu1.mp4', 'nechapu1.avi');
})    


// ipcRenderer.on('ffmpeg-convert-result', (event, code) => {
//     console.log(`FFmpeg conversion completed with exit code ${code}`);
//   });


// , (err, stdout, stderr) => {
//   if (err) {
//     console.log(err);
//     return;
//   }
//   console.log(stdout);
// } );