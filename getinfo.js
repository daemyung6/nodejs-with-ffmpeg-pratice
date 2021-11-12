const cp = require('child_process');
module.exports = function(filePath) {
    return new Promise(function(resolve, reject) {
        var ffprobe = cp.spawn('ffprobe', [
            '-show_format', '-show_streams',
            '-print_format', 'json',
            filePath
        ]);
        
        let dataChunk = [];
        ffprobe.stdout.on('data', (data) => {
            dataChunk.push(data);
        });
        ffprobe.stdout.on('end', () => {
            let data = String(Buffer.concat(dataChunk));
            try {
                data = JSON.parse(data);
            }
            catch(e) {
                reject(e);
                return;
            }
            if(typeof data.streams === 'undefined') {
                reject("get info fail");
                return;
            }
            resolve({
                codec_name : data.streams[0].codec_name,
                width : data.streams[0].width,
                height : data.streams[0].height,
            })
        })
    })
}