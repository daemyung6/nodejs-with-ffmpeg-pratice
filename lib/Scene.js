const getFrame2Buffer = require("./getFrame2Buffer.js");
const createBuffer2video = require("./createBuffer2video.js");
const Subtitle = require("./Subtitle.js");
const { createCanvas, Image, registerFont } = require('canvas');
const spawn = require('child_process').spawn;
const tempVideoPath = `${__dirname}/../temp/temp.mp4`;

module.exports = function(outVideoPath, outfps, outWidth, outHeight, sceneEndcallback) {
    const that = this;

    this.readers = [];
    this.addInputVideo = function(inputVideoPath, startTime, timeLength) {
        that.readers.push(new getFrame2Buffer(inputVideoPath, startTime, timeLength, outfps));
    }

    this.subtitles = [];
    this.addSubtitle = function(startTime, timeLength, text) {
        that.subtitles.push(new Subtitle(startTime, timeLength, outfps, text));
    }

    const writer = new createBuffer2video(tempVideoPath, outfps);
    writer.start();

    const canvas = createCanvas(outWidth, outHeight);
    this.setFont = function(fontPath, fontName, fontSize) {
        registerFont(fontPath, { family: fontName });
        ctx.font = `${fontSize} ${fontName}`;
    }

    const ctx = canvas.getContext('2d');
    ctx.font = '50px Impact';
    ctx.textAlign = 'center';
    let image;
    let readerCount = 0;
    let fpsCount = 0;
    this.renderStart = function() {
        const reader = that.readers[readerCount];
        reader.setOnData(function(data, count) {
            image = new Image();
            image.onload = onImgonload;
            image.src = data;

            function onImgonload() {
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                
                for (let i = 0; i < that.subtitles.length; i++) {
                    if(
                        (that.subtitles[i].start <= fpsCount) &&
                        (fpsCount < that.subtitles[i].end)
                    ) {
                        ctx.fillStyle = "black";
                        ctx.globalAlpha = 0.5;
                        ctx.fillRect(
                            canvas.width * 1 / 12,
                            canvas.height * 19 / 24,
                            canvas.width * 10 / 12,
                            canvas.height * 3 / 24
                        );
                        ctx.globalAlpha = 1;
                        ctx.fillStyle = "white";
                        ctx.fillText(that.subtitles[i].text, canvas.width / 2, canvas.height * 21 / 24);
                        break;
                    }
                }
                
                let buf = canvas.toBuffer('image/png', {
                    compressionLevel: 0,
                    filters: canvas.PNG_FILTER_NONE 
                });
            
                writer.pushData(buf);
                
                setTimeout(function() { 
                    ++fpsCount;
                    reader.next();
                }, 0)
            }
        })
        reader.setOnEnd(function(count) {
            ++readerCount;
            if(that.readers.length == readerCount) {
                writer.end();
                setTimeout(function() {
                    onRenderEnd();
                }, 1000)
            }
            else {
                console.log("next start");
                setTimeout(function() { 
                    that.renderStart();
                }, 0)
            }
        })
        reader.start();
    }
    

    function onRenderEnd() {
        let audios = [];
        for (let i = 0; i < that.readers.length; i++) {
            audios.push(that.readers[i].audioChunk);
        }

        const ffmpeg = spawn("ffmpeg", [
            `-y`,
            '-i', tempVideoPath,
            '-i', `pipe:`,
            '-c:v', 'copy',
            '-c:a', 'aac',
            outVideoPath
        ]);
        ffmpeg.stderr.pipe(process.stdout);

        ffmpeg.stdout.on('close', function() {
            console.log("stdout close");
            ffmpeg.stdin.end();
            sceneEndcallback();
        })
        ffmpeg.stdout.on('error', function(err) {
            console.log("stdout error", err);
        })

        for (let i = 0; i < that.readers.length; i++) {
            for (let j = 0; j < that.readers[i].audioChunk.length; j++) {
                ffmpeg.stdin.cork();
                ffmpeg.stdin.write(that.readers[i].audioChunk[j]);
                ffmpeg.stdin.uncork();
            }  
        }
        ffmpeg.stdin.end();
        
    }
}