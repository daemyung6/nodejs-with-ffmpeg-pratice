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
            let outdata = {};
            for (let i = 0; i < data.streams.length; i++) {
                outdata[data.streams[i].codec_type] = data.streams[i];
            }
            resolve(outdata);
        })
    })
}