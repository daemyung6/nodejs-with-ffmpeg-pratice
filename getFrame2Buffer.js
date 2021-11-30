const spawn = require('child_process').spawn;
const EOF = [0xFF, 0xD9];
const fs = require("fs");
const getinfo = require("./getinfo.js");

/**
 * 
 * @param {String} filePath file path
 * @param {String} startTime 00:00:00 time
 * @param {String} timeLength 00:00:00 time
 */
module.exports = function(filePath, startTime, timeLength, outfps) {
    const that = this;
    this.count = 0;
    let nextFunc;
    this.start = function() {
        if(typeof that.onDataFunc !== 'function') { console.error("no set onData function"); return;}
        if(typeof that.onEndFunc !== 'function') { console.error("no set onEnd function"); return;}

        getinfo(filePath)
        .then(data => {
            console.log(data.video.width)
            console.log(data.video.height)
            var tempstr = data.video.r_frame_rate.split("/");
            let videoFps = Number(tempstr[0]) / Number(tempstr[1]);
            console.log("videoFps :", videoFps, "outfps :", outfps);
    
            if(outfps > videoFps) {
                that.frameRateFlag = true;
                that.frameRate = outfps / videoFps;
            }
            else {
                that.frameRateFlag = false;
                that.frameRate = videoFps / outfps;
            }
            console.log("that.frameRateFlag",that.frameRateFlag );
            console.log("that.frameRate", that.frameRate);
            start();
        });
    }
    
    function start() {
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
        let ratioCount = 0;
        let addNum = 0;
        let passnum = 0;

        nextFunc = function() {
            for (; bufferCount < bufferDataArray.length; bufferCount++) {
                if(
                    (bufferDataArray[bufferCount + 0] == EOF[0]) &&
                    (bufferDataArray[bufferCount + 1] == EOF[1])
                ) {
                    tempBuffer.push(bufferDataArray[bufferCount + 0]);
                    tempBuffer.push(bufferDataArray[bufferCount + 1]);
                    bufferCount += 2;
                    
                    ratioCount += (that.frameRate - 1);
                    addNum = Math.floor(ratioCount);
                    ratioCount -= addNum;

                    let frameBuffer = Buffer.from(tempBuffer);

                    if(that.frameRateFlag) {
                        for (let i = 0; i < addNum; i++) {
                            that.onDataFunc(frameBuffer, that.count);
                            // --ratioCount;
                            ++that.count;
                            console.log("added", addNum);
                        }
                        that.onDataFunc(frameBuffer, that.count);
                        ++that.count;
                        console.log("count :", that.count);

                        tempBuffer = [];
                        return;
                        
                    }
                    else {
                        if(passnum !== 0) {
                            --passnum;
                            tempBuffer = [];
                            setTimeout(nextFunc, 0);
                            console.log("pass")
                            return;
                        }
                        else {
                            passnum = addNum;
                        }

                        that.onDataFunc(frameBuffer, that.count);
                        ++that.count;
                        console.log("count :", that.count);
                        tempBuffer = [];
                        return;
                    }
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