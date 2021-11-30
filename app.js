const getFrame2Buffer = require("./getFrame2Buffer.js");
const createBuffer2video = require("./createBuffer2video.js");
const { createCanvas, Image } = require('canvas');


const outVideoPath = `${__dirname}/out.mp4`;
const outfps = 60;
const outWidth = 1920;
const outHeight = 1080;


let readers = [];
readers.push(new getFrame2Buffer(`${__dirname}/inputVideo1.mp4`, "00:00:00", "00:00:03", outfps));
readers.push(new getFrame2Buffer(`${__dirname}/inputVideo2.mp4`, "00:03:00", "00:00:03", outfps));

const writer = new createBuffer2video(outVideoPath, outfps);
writer.start();

const canvas = createCanvas(outWidth, outHeight);
const ctx = canvas.getContext('2d');
let image;



let readerCount = 0;
function readerStart() {
    const reader = readers[readerCount];
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
                reader.next();
            }, 0)
        }
    })
    reader.setOnEnd(function(count) {
        console.log("readerCount end", readerCount, count);
        ++readerCount;
        if(readers.length == readerCount) {
            writer.end();
        }
        else {
            console.log("next start");
            setTimeout(function() { 
                readerStart();
            }, 1000)
        }
    })
    reader.start();
}
readerStart();