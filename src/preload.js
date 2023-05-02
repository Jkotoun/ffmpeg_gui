const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    saveFile: () => ipcRenderer.invoke('dialog:saveFile'),
    getMediaInfo: (filePath) => ipcRenderer.invoke('getMediaInfo', filePath),
    exportVideo: (
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
    ) =>
        ipcRenderer.invoke(
            'exportVideo',
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
        ),
    handleExportProgress: (callback) =>
        ipcRenderer.on('exportProgress', callback),
    cancelExporting: () => ipcRenderer.invoke('cancelExporting'),
});
