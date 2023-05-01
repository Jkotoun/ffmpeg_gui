
import './index.css';


//elements selectors
const sourcefilebtn = document.getElementById('sourcefileBtn')
const sourcefilePathElement = document.getElementById('sourcefilePath')
const outputfilebtn = document.getElementById('outputfileBtn')
const outputfilePathElement = document.getElementById('outputfilePath')
const exportbtn = document.getElementById('exportBtn')
const exportingProgressElement = document.getElementById('exportingProgress')
const cancelExportingBtn = document.getElementById('cancelExportingBtn')
const ffmpegFileInfoElement = document.getElementById('ffmpegFileInfo')


function formatFileinfo(fileinfoJSON) {
    console.log(fileinfoJSON)
    return JSON.stringify(fileinfoJSON)
}



sourcefilebtn.addEventListener('click', async () => {
    const filePath = await window.electronAPI.openFile()
    if (filePath) {

        ffmpegFileInfoElement.innerText = 'Loading file info...'
        sourcefilePathElement.innerText = filePath
        window.electronAPI.getMediaInfo(filePath)
            .then(x => {
                ffmpegFileInfoElement.innerText = formatFileinfo(x)
            })
            .catch(x => {
                console.log('error', x)
            })
    }
})


outputfilebtn.addEventListener('click', async () => {
    const filePath = await window.electronAPI.saveFile()
    if (filePath) {
        outputfilePathElement.innerText = filePath
    }
})

// exportbtn.addEventListener('click', async () => {
//     const exportResult = await window.electronAPI.exportVideo()
//     exportingProgressElement.innerText = 'Exporting...'
//     console.log(exportResult)
// })



exportbtn.addEventListener('click', async () => {
    exportbtn.disabled = true
    cancelExportingBtn.disabled = false
    let inputFilePath = sourcefilePathElement.innerText
    let outputFilePath = outputfilePathElement.innerText
    
    //set from select input with common codecs with some mapping from human readable values (like h264 = libx264)
    let videoCodec = "libx264"
    //same
    let audioCodec = "aac"
    //idk, preset values or number input
    let videoBitrate = "1000k"
    let audioBitrate = "128k"

    //preset values or number input
    let audioSampleRate = "44100"
    //presets
    let audioChannels = "2"

    //preset - rendering quality/speed  options: ultrafast, superfast, veryfast, fast, medium, slow, and veryslow
    let preset = "medium"
    //presets
    let resolution = "1280x720"
    //number input with min max limit or presets
    let framerate = "30"
    //should be range select from 0 to video duration, can be read from fileInfo json
    let offset = "0"
    let duration = 60
    //array with key value pairs containing valid metadata, ffmpeg doesnt crash when metadata is invalid
    //idk how to do this, maybe dynamic number of  selects for common metadata keys and inputs for values
    let metadata = [
        {
            key: "title",
            value: "test"
        },
        {
            key: "artist",
            value: "test artist"
        },
        {
            key: "album",
            value: "test alb"
        },

    ]

    if (!inputFilePath || !outputFilePath) {
        return
    }

    exportingProgressElement.innerText = 'Exporting...'
    window.electronAPI.exportVideo(
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
        )
        .catch(x => {
            exportingProgressElement.innerText = `Exporting failed!`
        })
        .finally(_ => {
            exportbtn.disabled = false
            cancelExportingBtn.disabled = true
        })
})

window.electronAPI.handleExportProgress((sender, progress) => {
    if (progress < 100) {
        exportingProgressElement.innerText = `Exporting... ${progress}%`
    }
    else {
        
        exportingProgressElement.innerText = `Export completed!`
    }
})


cancelExportingBtn.addEventListener('click', async () => {
    cancelExportingBtn.disabled = true
    window.electronAPI.cancelExporting()
        .then(_ => {
            exportingProgressElement.innerText = `Exporting canceled!`
        })
        .catch(x => {
            exportingProgressElement.innerText = `Exporting cancelation failed!`
        })
        .finally(_ => {
            exportbtn.disabled = false
            cancelExportingBtn.disabled = true
        })
})