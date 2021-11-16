const spawn = require('child_process').spawn;

module.exports = function(filePath, framerate) {
    const that = this;
    let ffmpeg;
    let onPushData;
    let is_start = false;
    this.start = function() {
        is_start = true;
        ffmpeg = spawn('ffmpeg', [
            `-y`,
            '-framerate', framerate,
            '-r', framerate,
            '-i', 'pipe:',
            '-pix_fmt', 'yuv420p',
            '-r', framerate,
            '-framerate', framerate,
            filePath
        ]);

        //콘솔 출력
        // ffmpeg.stderr.pipe(process.stdout);
        
        console.log("filePath", filePath);
        onPushData = function(buffer) {
            ffmpeg.stdin.cork();
            ffmpeg.stdin.write(buffer);
            ffmpeg.stdin.uncork();
        }
    }
    this.pushData = function(Buffer) {
        if(!is_start) { console.error("not start") }
        onPushData(Buffer);
    }

    this.end = function() {
        if(!is_start) { console.error("not start") }
        ffmpeg.stdin.end();
        
    }
}