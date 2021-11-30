const getFrame2Buffer = require("./getFrame2Buffer.js");
const createBuffer2video = require("./createBuffer2video.js");
const { createCanvas, Image } = require('canvas');


const outVideoPath = `${__dirname}/out.mp4`;
const outfps = 60;
const outWidth = 1920;
const outHeight = 1080;


let readers = [];
readers.push(new getFrame2Buffer(`${__dirname}/inputVideo1.mp4`, "00:00:00", "00:00:03", outfps));
readers.push(new getFrame2Buffer(`${__dirname}/inputVideo2.mp4`, "00:00:05", "00:00:07", outfps));

const writer = new createBuffer2video(outVideoPath, outfps);
writer.start();

const canvas = createCanvas(outWidth, outHeight);
const ctx = canvas.getContext('2d');
let image;

function Subtitle(start, end, outfps, text) {
    function getFPS(timestr, outfps) {
        let h = Number(timestr.split(":")[0]);
        let m = Number(timestr.split(":")[1]);
        let s = Number(timestr.split(":")[2]);
    
        let fps = h * 60 * 60 * outfps;
            fps+= m * 60 * outfps;
            fps+= s * outfps;
        return fps;
    }

    this.start = getFPS(start, outfps);
    this.end = getFPS(end, outfps);
    this.text = text;
}

let subtitles = [];
subtitles.push(new Subtitle('00:00:00', '00:00:03', outfps, 'hello! world!'));
subtitles.push(new Subtitle('00:00:05', '00:01:10', outfps, 'hihi!!'));




let readerCount = 0;
let fpsCount = 0;
function readerStart() {
    const reader = readers[readerCount];
    reader.setOnData(function(data, count) {
        image = new Image();
        image.onload = onImgonload;
        image.src = data;

        function onImgonload() {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            

            for (let i = 0; i < subtitles.length; i++) {
                if(
                    (subtitles[i].start <= fpsCount) &&
                    (fpsCount < subtitles[i].end)
                ) {
                    ctx.font = '50px Impact'
                    ctx.textAlign = 'center';
                    ctx.fillText(subtitles[i].text, canvas.width / 2, canvas.height * 6 / 7);
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