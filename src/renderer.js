import './index.css';

//elements selectors
const sourcefilebtn = document.getElementById('sourcefileBtn');
const sourcefilePathElement = document.getElementById('sourcefilePath');
const outputfilebtn = document.getElementById('outputfileBtn');
const outputfilePathElement = document.getElementById('outputfilePath');
const exportbtn = document.getElementById('exportBtn');
const exportingProgressElement = document.getElementById('exportingProgress');
const cancelExportingBtn = document.getElementById('cancelExportingBtn');
const addRow = document.getElementById('addRow');
const removeRow = document.getElementById('removeRow');
const ffmpegFileInfoElement = document.getElementById('ffmpegFileInfo');
const preset = document.getElementById('preset');
const trimRangeOffset = document.getElementById('trimRangeOffset');
const trimRangeDuration = document.getElementById('trimRangeDuration');
const options = document.getElementById('options');

//inputs
const videoCodec = document.getElementById('videoCodec');
const audioCodec = document.getElementById('audioCodec');
const videoBitrate = document.getElementById('videoBitrate');
const audioBitrate = document.getElementById('audioBitrate');
const audioSampleRate = document.getElementById('audioSampleRate');
const audioChannels = document.getElementById('audioChannels');
const resolution = document.getElementById('resolution');
const framerate = document.getElementById('framerate');

let rangeMin = 10;
const range = document.querySelector('.range-selected');
const rangeInput = document.querySelectorAll('.range-input input');

rangeInput.forEach((input) => {
    input.addEventListener('input', (e) => {
        let minRange = parseInt(rangeInput[0].value);
        let maxRange = parseInt(rangeInput[1].value);
        if (maxRange - minRange < rangeMin) {
            if (e.target.className === 'min') {
                rangeInput[0].value = maxRange - rangeMin;
            } else {
                rangeInput[1].value = minRange + rangeMin;
            }
        } else {
            range.style.left = (minRange / rangeInput[0].max) * 100 + '%';
            range.style.right =
                100 - (maxRange / rangeInput[1].max) * 100 + '%';
        }

        trimRangeDuration.innerText = rangeInput[1].value;
        trimRangeOffset.innerText = rangeInput[0].value;
    });
});

function getTableData() {
    var table = document.getElementById('myTable');
    var data = [];
    for (var i = 0; i < table.rows.length; i++) {
        // Start from 1 to skip header row
        var key = table.rows[i].cells[0].querySelector('input').value;
        var value = table.rows[i].cells[1].querySelector('input').value;
        data.push({ key: key, value: value });
    }
    return data;
}

function formatFileinfo(mediaInfo) {
    console.log(mediaInfo);
    let html = '<table>';
    for (const stream of mediaInfo.streams) {
        html +=
            '<tr><td>Stream Type:</td><td>' + stream.codec_type + '</td></tr>';
        html += '<tr><td>Codec:</td><td>' + stream.codec_name + '</td></tr>';
        html +=
            '<tr><td>Bitrate:</td><td>' +
            stream.bit_rate / 1000 +
            'kbps</td></tr>';
        html +=
            '<tr><td>Resolution:</td><td>' +
            stream.width +
            'x' +
            stream.height +
            '</td></tr>';
    }
    html += '</table>';
    return html;
}

sourcefilebtn.addEventListener('click', async () => {
    const filePath = await window.electronAPI.openFile();
    if (filePath) {
        ffmpegFileInfoElement.innerText = 'Loading file info...';
        sourcefilePathElement.innerText = filePath;
        window.electronAPI
            .getMediaInfo(filePath)
            .then((x) => {
                let duration = x.format.duration;
                ffmpegFileInfoElement.innerHTML = formatFileinfo(x);
                options.style.display = 'block';
                debugger;
                rangeInput.forEach((input) => {
                    if (input.className === 'max') {
                        input.setAttribute("value", parseFloat(duration))
                    }
                    input.setAttribute("max", parseFloat(duration));
                    const stepSize = parseFloat(duration) / 10000;
                    input.setAttribute("step", stepSize)

                });
                trimRangeDuration.innerText = duration;
            })
            .catch((x) => {
                ffmpegFileInfoElement.innerText = 'Error loading file info';
                console.log('error', x);
            });
    }
});

outputfilebtn.addEventListener('click', async () => {
    const filePath = await window.electronAPI.saveFile();
    if (filePath) {
        outputfilePathElement.innerText = filePath;
    }
});

addRow.addEventListener('click', async () => {
    const row = document.createElement('tr');
    const keyInput = document.createElement('input');
    const valueInput = document.createElement('input');
    const key = document.createElement('td');
    const value = document.createElement('td');

    keyInput.classList.add('tableInput');
    keyInput.setAttribute("type", "text");
    valueInput.classList.add('tableInput');
    valueInput.setAttribute("type", "text");
    key.appendChild(keyInput);
    value.appendChild(valueInput);
    row.appendChild(key);
    row.appendChild(value);
    document.getElementById('myTable').appendChild(row);
});

removeRow.addEventListener('click', async () => {
    const table = document.getElementById('myTable');
    if (table.rows.length > 0) {
        table.deleteRow(-1);
    }
});

exportbtn.addEventListener('click', async () => {
    exportbtn.disabled = true;
    cancelExportingBtn.disabled = false;
    let inputFilePath = sourcefilePathElement.innerText;
    let outputFilePath = outputfilePathElement.innerText;
    document.getElementById('exportingProgressbar').style.display = 'block';

    //set from select input with common codecs with some mapping from human readable values (like h264 = libx264)
    let videoCodec = 'libx264';
    //same
    let audioCodec = 'aac';
    //idk, preset values or number input
    let videoBitrate = '1000k';
    let audioBitrate = '128k';

    //preset values or number input
    let audioSampleRate = '44100';
    //presets
    let audioChannels = '2';

    //preset - rendering quality/speed  options: ultrafast, superfast, veryfast, fast, medium, slow, and veryslow
    let preset = preset.value.toLowerCase();
    //presets
    let resolution = '1280x720';
    //number input with min max limit or presets
    let framerate = '30';
    //should be range select from 0 to video duration, can be read from fileInfo json
    let offset = '0';
    let duration = 60;
    //array with key value pairs containing valid metadata, ffmpeg doesnt crash when metadata is invalid
    //idk how to do this, maybe dynamic number of  selects for common metadata keys and inputs for values
    let metadata = getTableData();

    if (!inputFilePath || !outputFilePath) {
        return;
    }

    exportingProgressElement.innerText = 'Exporting...';
    window.electronAPI
        .exportVideo(
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
        .catch((x) => {
            exportingProgressElement.innerText = `Exporting failed!`;
        })
        .finally((_) => {
            exportbtn.disabled = false;
            cancelExportingBtn.disabled = true;
        });
});

window.electronAPI.handleExportProgress((sender, progress) => {
    const bar = document.getElementById('exportingProgressbar');
    if (progress < 100) {
        exportingProgressElement.innerText = `Exporting... ${progress}%`;
        bar.setAttribute("value", progress);
    } else {
        exportingProgressElement.innerText = `Export completed!`;
        bar.setAttribute("value", 0);
        bar.style.display = 'none';
    }
});

cancelExportingBtn.addEventListener('click', async () => {
    cancelExportingBtn.disabled = true;
    window.electronAPI
        .cancelExporting()
        .then((_) => {
            exportingProgressElement.innerText = `Exporting canceled!`;
        })
        .catch((x) => {
            exportingProgressElement.innerText = `Exporting cancelation failed!`;
        })
        .finally((_) => {
            exportbtn.disabled = false;
            cancelExportingBtn.disabled = true;
        });
});
