
import './index.css';


//elements selectors
const sourcefilebtn = document.getElementById('sourcefileBtn')
const sourcefilePathElement = document.getElementById('sourcefilePath')
const outputfilebtn = document.getElementById('outputfileBtn')
const outputfilePathElement = document.getElementById('outputfilePath')
const exportbtn = document.getElementById('exportBtn')
const exportingProgressElement = document.getElementById('exportingProgress')
const cancelExportingBtn = document.getElementById('cancelExportingBtn')
const addRow = document.getElementById('addRow')
const removeRow = document.getElementById('removeRow')
const ffmpegFileInfoElement = document.getElementById('ffmpegFileInfo')
const preset = document.getElementById('preset')
const trimRange = document.getElementById('trimRange')

//inputs
const videoCodec = document.getElementById('videoCodec')
const audioCodec = document.getElementById('audioCodec')
const videoBitrate = document.getElementById('videoBitrate')
const audioBitrate = document.getElementById('audioBitrate')
const audioSampleRate = document.getElementById('audioSampleRate')
const audioChannels = document.getElementById('audioChannels')
const resolution = document.getElementById('resolution')
const framerate = document.getElementById('framerate')


function getTableData() {
    var table = document.getElementById("myTable");
    var data = [];
    for (var i = 1; i < table.rows.length; i++) { // Start from 1 to skip header row
        var key = table.rows[i].cells[0].querySelector('input').value;
        var value = table.rows[i].cells[1].querySelector('input').value;
        data.push({ key: key, value: value });
    }
    return data
}

function formatFileinfo(fileinfoJSON) {
    console.log(fileinfoJSON)
    return JSON.stringify(fileinfoJSON)
}

trimRange.addEventListener('change', async () => {
    console.log(trimRange.value)
    const displayElement = document.getElementById('trimRangeDisplay')

    displayElement.innerText = trimRange.value
})

preset.addEventListener('change', async () => {
    switch (preset.value) {
        case 'ultrafast':
            videoBitrate.value = '1000k'
            audioBitrate.value = '128k'
            audioSampleRate.value = '44100'
            audioChannels.value = '2'
            resolution.value = '1280x720'
            framerate.value = '30'
            break;

        case 'superfast':
            videoBitrate.value = '1000k'
            audioBitrate.value = '128k'
            audioSampleRate.value = '44100'
            audioChannels.value = '2'
            resolution.value = '1280x720'
            framerate.value = '30'
            break;

        case 'veryfast':
            videoBitrate.value = '1000k'
            audioBitrate.value = '128k'
            audioSampleRate.value = '44100'
            audioChannels.value = '2'
            resolution.value = '1280x720'
            framerate.value = '30'
            break;

        case 'fast':
            videoBitrate.value = '1000k'
            audioBitrate.value = '128k'
            audioSampleRate.value = '44100'
            audioChannels.value = '2'
            resolution.value = '1280x720'
            framerate.value = '30'
            break;

        case 'medium':
            videoBitrate.value = '1000k'
            audioBitrate.value = '128k'
            audioSampleRate.value = '44100'
            audioChannels.value = '2'
            resolution.value = '1280x720'
            framerate.value = '30'
            break;

        case 'slow':
            videoBitrate.value = '1000k'
            audioBitrate.value = '128k'
            audioSampleRate.value = '44100'
            audioChannels.value = '2'
            resolution.value = '1280x720'
            framerate.value = '30'
            break;

        case 'veryslow':
            videoBitrate.value = '1000k'
            audioBitrate.value = '128k'
            audioSampleRate.value = '44100'
            audioChannels.value = '2'
            resolution.value = '1280x720'
            framerate.value = '30'
            break;
    }
})

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


addRow.addEventListener('click', async () => {
    const row = document.createElement('tr');
    const keyInput = document.createElement('input');
    const valueInput = document.createElement('input');
    const key = document.createElement('td');
    const value = document.createElement('td');

    keyInput.classList.add('tableInput');
    valueInput.classList.add('tableInput');
    key.appendChild(keyInput);
    value.appendChild(valueInput);
    row.appendChild(key);
    row.appendChild(value);
    document.getElementById('myTable').appendChild(row);
})

removeRow.addEventListener('click', async () => {
    const table = document.getElementById('myTable');
    if (table.rows.length > 1) {
        table.deleteRow(-1);
    }
})

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
    let metadata = getTableData()

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