import './index.css';

//elements selectors
const sourcefilebtn = document.getElementById('sourcefileBtn');
const sourcefilePathElement = document.getElementById('sourcefilePath');
const outputfilebtn = document.getElementById('outputfileBtn');
const outputfilePathElement = document.getElementById('outputfilePath');
const exportbtn = document.getElementById('exportBtn');
const progressLabel = document.getElementById('progressLabel');
const cancelExportingBtn = document.getElementById('cancelExportingBtn');
const addRow = document.getElementById('addRow');
const removeRow = document.getElementById('removeRow');
const ffmpegFileInfoElement = document.getElementById('info');
const bottomBarProgress = document.getElementById('bottomBarProgress');
const progressBar = document.getElementById('progressBar');

const options = document.getElementById('optionsWrapper');

// Video inputs
const preset = document.getElementById('preset');
const videoCodec = document.getElementById('videoCodec');
const videoBitrate = document.getElementById('videoBitrate');
const resolution = document.getElementById('resolution');
const framerate = document.getElementById('framerate');

// Audio inputs
const audioCodec = document.getElementById('audioCodec');
const audioBitrate = document.getElementById('audioBitrate');
const audioChannels = document.getElementById('audioChannels');
const audioSampleRate = document.getElementById('audioSampleRate');

// Trim inputs
const trimRangeOffset = document.getElementById('trimRangeOffset');
const trimRangeDuration = document.getElementById('trimRangeDuration');

const range = document.querySelector('.rangeSelected');
const rangeInput = document.querySelectorAll('.rangeInput input');

let minDiff = 1;
let steps = 100;

let sourceSelected = false;
let outputSelected = false;

function setRangeStyle(min, max) {
    range.style.left = (min / rangeInput[0].max) * 100 + '%';
    range.style.right =
        100 - (max / rangeInput[1].max) * 100 + '%';
}

function evaluateExportButton() {
    if (sourceSelected && outputSelected) {
        exportbtn.disabled = false;
        document.getElementById("fileSelectMessage").style.display = "none";
    }
    else {
        exportbtn.disabled = true;
    }
}

function formatDuration(duration) {
    // Calculate hours, minutes and seconds
    var hours = Math.floor(duration / 3600);
    var minutes = Math.floor((duration % 3600) / 60);
    var seconds = Math.floor(duration % 60);

    // Add leading zeros if necessary
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    // Combine hours, minutes and seconds into a string
    var formattedDuration = hours + ":" + minutes + ":" + seconds;
    return formattedDuration;
}

function getTableData() {
    var table = document.getElementById('metadataTable');
    var data = [];
    for (var i = 0; i < table.rows.length; i++) {
        // Start from 1 to skip header row
        var key = table.rows[i].cells[0].querySelector('select').value;
        var value = table.rows[i].cells[1].querySelector('input').value;
        data.push({ key: key, value: value });
    }
    return data;
}

function formatFileinfo(mediaInfo) {
    let html = '<table>';
    html += '<tr><td><strong>Format:</strong></td><td><strong>' + mediaInfo.format.format_name + '</strong></td></tr>';
    html += '<tr><td>Duration:</td><td>' + formatDuration(mediaInfo.format.duration) + '</td></tr>';
    html += '<tr><td>Size:</td><td>' + mediaInfo.format.size + ' Bytes</td></tr>';
    html += '<tr><td>Bitrate:</td><td>' + mediaInfo.format.bit_rate / 1000 + 'kbps</td></tr>';
    html += '<tr><td><strong>Tags:</strong></td><td></td></tr>';

    for (const [tag, value] of Object.entries(mediaInfo.format.tags)) {
        html += '<tr><td>' + tag + '</td><td>' + value + '</td></tr>';
    }

    for (const stream of mediaInfo.streams) {
        html +=
            '<tr><td><strong>Stream Type:</strong></td><td><strong>' + stream.codec_type + '<strong></td></tr>';
        html += '<tr><td>Codec:</td><td>' + stream.codec_name + '</td></tr>';
        html +=
            '<tr><td>Bitrate:</td><td>' +
            stream.bit_rate / 1000 +
            'kbps</td></tr>';
        if (stream.codec_type === 'video') {
            html +=
                '<tr><td>Resolution:</td><td>' +
                stream.width +
                'x' +
                stream.height +
                '</td></tr>';
            html += '<tr><td>Avg. frame rate:</td><td>' + Math.round(eval(stream.r_frame_rate)) + '</td></tr>';
        } else if (stream.codec_type === 'audio') {
            html += '<tr><td>Channels:</td><td>' + stream.channels + '</td></tr>';
        }
    }

    html += '</table>';
    return html;
}

rangeInput.forEach((input) => {
    input.addEventListener('input', (e) => {
        let lowerBoundRangeVal = parseFloat(rangeInput[0].value);
        let upperBoundRangeVal = parseFloat(rangeInput[1].value);
        //check if upper bound is less than lower bound, if so, fix it with minimal difference
        if (upperBoundRangeVal - lowerBoundRangeVal < minDiff) {
            if (e.target.className === 'min') {
                rangeInput[0].value = upperBoundRangeVal - minDiff;
            } else {
                rangeInput[1].value = lowerBoundRangeVal + minDiff;
            }
        } else {
            setRangeStyle(lowerBoundRangeVal, upperBoundRangeVal)
        }

        trimRangeDuration.innerText = formatDuration(rangeInput[1].value);
        trimRangeOffset.innerText = formatDuration(rangeInput[0].value);
    });
});


sourcefilebtn.addEventListener('click', async () => {
    let sourceFileElement = document.querySelector('#sourceFileText');
    let sourceFilePath = document.querySelector('#sourceFilePath');
    const filePath = await window.electronAPI.openFile();
    if (filePath) {
        ffmpegFileInfoElement.innerText = 'Loading file info...';
        inputFilePath = filePath;
        window.electronAPI
            .getMediaInfo(filePath)
            .then((x) => {
                let duration = x.format.duration;
                sourceSelected = true;
                evaluateExportButton();
                sourceFileElement.style.display = 'block';
                sourceFilePath.innerText = filePath;  
                ffmpegFileInfoElement.innerHTML = formatFileinfo(x);
                options.style.display = 'block';
                bottomBarProgress.style.display = 'none';
                rangeInput.forEach((input) => {
                    input.setAttribute("max", parseFloat(duration));
                    const stepSize = parseFloat(duration) / steps;
                    input.setAttribute("step", stepSize)
                    minDiff = stepSize*5;
                    if (input.className === 'max') {
                        input.setAttribute("value", parseFloat(duration))
                    }
                    setRangeStyle(0, parseFloat(duration))

                });
                trimRangeDuration.innerText = formatDuration(duration);
            })
            .catch((x) => {
                ffmpegFileInfoElement.innerText = 'Error loading file info';
            });
    }
});

outputfilebtn.addEventListener('click', async () => {
    const filePath = await window.electronAPI.saveFile();
    let outputFileElement = document.querySelector('#outputFileText');
    let outputFilePathElement = document.querySelector('#outputFilePath');

    if (filePath) {
        outputSelected = true;
        evaluateExportButton();
        outputFilePath = filePath;
        outputFileElement.style.display = 'block';
        outputFilePathElement.innerText = outputFilePath;
        document.getElementById("files").appendChild(textDisplay);
    }
});

addRow.addEventListener('click', async () => {
    const row = document.createElement('tr');
    const keyInput = document.createElement('select');
    const valueInput = document.createElement('input');
    const key = document.createElement('td');
    const value = document.createElement('td');

    const avalibleKeys = [
        "title",
        "artist",
        "album",
        "year",
        "comment",
        "track",
        "genre",
        "composer",
        "copyright",
        "language"
    ]

    for (const key of avalibleKeys) {
        const option = document.createElement('option');
        option.value = key;
        option.innerText = key.charAt(0).toUpperCase() + key.slice(1);
        keyInput.appendChild(option);
    }


    keyInput.classList.add('tableInput');
    keyInput.setAttribute("type", "text");
    valueInput.classList.add('tableInput');
    valueInput.setAttribute("type", "text");
    key.appendChild(keyInput);
    value.appendChild(valueInput);
    row.appendChild(key);
    row.appendChild(value);
    document.getElementById('metadataTable').appendChild(row);
});

removeRow.addEventListener('click', async () => {
    const table = document.getElementById('metadataTable');
    if (table.rows.length > 0) {
        table.deleteRow(-1);
    }
});


let inputFilePath = "";
let outputFilePath = "";

exportbtn.addEventListener('click', async () => {
    exportbtn.disabled = true;
    cancelExportingBtn.disabled = false;

    const trimOffsetInputValue = document.getElementById("trimOffsetInput").value
    const trimDurationInputValue = document.getElementById("trimDurationInput").value

    if (!inputFilePath || !outputFilePath) {
        return;
    }

    bottomBarProgress.style.display = 'flex';
    progressLabel.innerText = `Exporting...`;


    window.electronAPI
        .exportVideo(
            inputFilePath,
            outputFilePath,
            videoCodec.value,
            audioCodec.value,
            videoBitrate.value,
            audioBitrate.value,
            audioSampleRate.value,
            audioChannels.value,
            preset.value.toLowerCase(),
            resolution.value,
            framerate.value,
            trimOffsetInputValue,
            (trimDurationInputValue-trimOffsetInputValue),
            getTableData()
        )
        .then((resolve_code) => {
            if(resolve_code === 0){
                progressLabel.innerText = `Export completed!`;
                progressBar.setAttribute("value", 100);
            }
            else{
                progressLabel.innerText = `Export canceled!`;
                progressBar.setAttribute("value", 0);
            }
        })

        .catch((x) => {
            progressLabel.innerText = `Exporting failed!`;
        })
        .finally((resolve_code) => {
            // progressLabel.innerText = `Export completed!`;
            exportbtn.disabled = false;
            // progressBar.setAttribute("value", 100);
            cancelExportingBtn.disabled = true;
        });
});

cancelExportingBtn.addEventListener('click', async () => {
    cancelExportingBtn.disabled = true;
    window.electronAPI
        .cancelExporting()
        .then((_) => {
            progressLabel.innerText = `Exporting canceled!`;
        })
        .catch((x) => {
            progressLabel.innerText = `Exporting cancelation failed!`;
        })
        .finally((_) => {
            exportbtn.disabled = false;
            cancelExportingBtn.disabled = true;
        });
});

window.electronAPI.handleExportProgress((sender, progress) => {
    if (progress < 100) {
        progressLabel.innerText = `Exporting... ${progress}%`;
        progressBar.setAttribute("value", progress);
    } else {
        progressLabel.innerText = `Export completed!`;
        progressBar.setAttribute("value", 100);
    }
});