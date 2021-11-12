const getinfo = require("./getinfo.js");
const getFrame2Buffer = require("./getFrame2Buffer.js");
const createBuffer2video = require("./createBuffer2video.js");
const { createCanvas, Image } = require('canvas');
const fs = require("fs");

const inputVideoPath = `${__dirname}/testvideo.mp4`;
const outVideoPath = `${__dirname}/test.mp4`;

getinfo(inputVideoPath)
.then(function(videoInfo) {
    videoInfo.width = 1920;
    videoInfo.height = 1080;
    const canvas = createCanvas(videoInfo.width, videoInfo.height);
    const ctx = canvas.getContext('2d');
    let image;

    const reader = new getFrame2Buffer(inputVideoPath, "00:00:00", "00:00:18");
    const writer = new createBuffer2video(outVideoPath, "30");


    writer.start();
    reader.setOnData(function(data, count) {
        image = new Image();
        image.onload = onImgonload;
        image.src = data;
        function onImgonload() {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            ctx.font = '50px Impact'
            ctx.textAlign = 'center';
            ctx.fillText(`this is frame number ${count}`, canvas.width / 2, canvas.height * 4 / 5)

            let buf = canvas.toBuffer('image/png', {
                compressionLevel: 0,
                filters: canvas.PNG_FILTER_NONE 
            });

            writer.pushData(buf);
            
            setTimeout(function() { 
                if(
                    (typeof lastCount !== 'undefined') &&
                    (count === lastCount)
                ) {
                    console.log("count === lastCount: ", count);
                    writer.end();
                    return;
                }
                reader.next();
            }, 20)
        }
    })
    reader.setOnEnd(function(count) {
        console.log("lastCount:", count);
        lastCount = count;
    })
    let lastCount;
    reader.start();
})
.catch((e) => {
    console.log(e);
})

