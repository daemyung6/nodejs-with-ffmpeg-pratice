const getinfo = require("./getinfo.js");

getinfo("./original2.mp4")
.then(data => {
    console.log(data.video)
    console.log(data.video.width)
    console.log(data.video.height)
    var tempstr = data.video.r_frame_rate.split("/");
    console.log(Number(tempstr[0]) / Number(tempstr[1]))
});