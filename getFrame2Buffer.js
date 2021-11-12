const spawn = require('child_process').spawn;
const EOF = [0xFF, 0xD9];
const fs = require("fs");

let saveCount = 0;

/**
 * 
 * @param {String} filePath file path
 * @param {String} startTime 00:00:00 time
 * @param {String} timeLength 00:00:00 time
 */
module.exports = function(filePath, startTime, timeLength) {
    const that = this;
    this.count = 0;
    let nextFunc;
    this.start = function() {
        if(typeof that.onDataFunc !== 'function') { console.error("no set onData function"); return;}
        if(typeof that.onEndFunc !== 'function') { console.error("no set onEnd function"); return;}
        
        const ffmpeg = spawn("ffmpeg", [
            `-y`,
            '-ss', startTime,
            '-t', timeLength,
            '-i', filePath,
            '-f', 'image2pipe',
            '-codec:v', 'mjpeg', 
            '-q:v', '2',
            '-framerate', '1',
            'pipe:1'
        ]);

        that.count = 0;
        
        //콘솔 출력
        // ffmpeg.stderr.pipe(process.stdout);

        let tempBuffer = [];
        let bufferCount = 0;
        let bufferDataArray;

        nextFunc = function() {
            for (; bufferCount < bufferDataArray.length; bufferCount++) {
                if(
                    (bufferDataArray[bufferCount + 0] == EOF[0]) &&
                    (bufferDataArray[bufferCount + 1] == EOF[1])
                ) {
                    
                    tempBuffer.push(bufferDataArray[bufferCount + 0]);
                    tempBuffer.push(bufferDataArray[bufferCount + 1]);
                    bufferCount += 2;

                    let frameBuffer = Buffer.from(tempBuffer);

                    ++that.count;
                    console.log("count :", that.count);
                    
                    that.onDataFunc(frameBuffer, that.count);
                    tempBuffer = [];
                    return;
                }
                tempBuffer.push(bufferDataArray[bufferCount]);
            }
            ffmpeg.stdout.resume();
        }

        ffmpeg.stdout.on('data', function(data) {
            ffmpeg.stdout.pause();

            bufferDataArray = data;
            bufferCount = 0;

            nextFunc();
        })
        ffmpeg.stdout.on('close', function() {
            that.onEndFunc(that.count);
            
        })
    }
    this.onDataFunc;
    this.setOnData = function(callback) {
        that.onDataFunc = callback;
    }
    this.onEndFunc;
    this.setOnEnd = function(callback) {
        that.onEndFunc = callback;
    }
    this.next = function() {
        nextFunc();
    }
}