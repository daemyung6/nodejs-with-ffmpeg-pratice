function getFPS(timestr, outfps) {
    let h = Number(timestr.split(":")[0]);
    let m = Number(timestr.split(":")[1]);
    let s = Number(timestr.split(":")[2]);

    let fps = h * 60 * 60 * outfps;
        fps+= m * 60 * outfps;
        fps+= s * outfps;
    return fps;
}
module.exports = function(start, end, outfps, text) {
    this.start = getFPS(start, outfps);
    this.end = this.start + getFPS(end, outfps);
    this.text = text;
}