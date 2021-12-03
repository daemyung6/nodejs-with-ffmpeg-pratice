# nodejs-with-ffmpeg-pratice

### app.js
```js
const Scene = require("./lib/Scene.js");

const scene = new Scene(`${__dirname}/out/out.mp4`, 30, 1920, 1080, onEnd);

scene.addInputVideo(`${__dirname}/inputVideo1.mp4`, '00:01:00', '00:00:03');
scene.addInputVideo(`${__dirname}/inputVideo1.mp4`, '00:02:00', '00:00:03');
scene.addInputVideo(`${__dirname}/inputVideo1.mp4`, '00:03:00', '00:00:03');

scene.setFont(`${__dirname}/font/Arita4.0_B.otf`, 'AritaB', '52px');

scene.addSubtitle('00:00:01', '00:00:02', '비디오 1!!');
scene.addSubtitle('00:00:04', '00:00:02', '비디오 2 입니다!!');
scene.addSubtitle('00:00:07', '00:00:02', '3 입니다ㅏㅏ!!!');

scene.renderStart();
function onEnd() {
    console.log('end');
}
```
<br />
ffmpeg가 설치되어 있어야 작동합니다.<br />
nodejs 서버에서 영상 편집을 위해 만들었습니당.
