var chart;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 720;
canvas.height = 540;
ctx.translate(canvas.width / 2, canvas.height / 2);
var noteI = [];
const audio = document.getElementById("audio");
var Y = 0;
var totalBeatsPerMeasure = 4; // 4拍一小节
var metronomeAudio = new Audio();
var metronomeAudio2 = new Audio();
var currentMeasure = 1;
var lastBeatIndex = -1;
var currentBeatCount = 0;
var nowBeatLineI;
var bpm = 120
var backGroundColor
var noteColor
var riztimeNumber = 0

function readChart(files) {
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var data = JSON.parse(e.target.result);
            console.log(data);
            if ("fileVersion" in data) {
                console.log("已知谱面格式fileVersion = " + data.fileVersion);
                chart = data;
                noteColor = chart.themes[0].colorsList[1]
                backGroundColor = chart.themes[0].colorsList[0]
                getNotes(chart.lines);
                for (let i = 0; i < chart.challengeTimes.length; i++){
                    chart.challengeTimes[i].start = bpmToSecond(chart.challengeTimes[i].start, chart.bPM, chart.bpmShifts)
                    chart.challengeTimes[i].end = bpmToSecond(chart.challengeTimes[i].end, chart.bPM, chart.bpmShifts)
                }
            } else {
                console.error("未知谱面格式");
            }
        } catch (error) {
            console.log(error);
        }
    };
    reader.readAsText(file);
}

function bgmFiles(files) {
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            console.log("音乐文件");
            audio.src = URL.createObjectURL(file);
        } catch(error) {
            console.log(error);
        }
    };
    reader.readAsText(file);
}

function getNotes(lineJson) {
    var notesList = [];
    for (let i = 0; i < lineJson.length; i++) {
        let noteJsonList = lineJson[i].notes;
        if (noteJsonList.length > 0) {
            for (let i = 0; i < noteJsonList.length; i++) {
                let note = noteJsonList[i];
                note.beat = note.time;
                note.time = bpmToSecond(note.time, chart.bPM, chart.bpmShifts);
                notesList.push(noteJsonList[i]);
            }
        }
    }
    notesList.sort((a, b) => a.time - b.time);
    for (let i = 0; i < notesList.length; i++) {
        noteI.push(new Note(i, notesList[i]));
    }
    console.log(notesList);
}

function bpmToSecond(time, bpm, bpmJson) {
    if (bpmJson.length === 0) {
        return time * 60 / bpm;
    }
    for (let i = 0; i < bpmJson.length; i++) {
        if (!time > bpmJson[bpmJson.length - 1].time) {
            if (time > bpmJson[i].time || time < bpmJson[i + 1].time) {
                return time * 60 / bpm * bpmJson[i].value;
            }
        } else {
            return time * 60 / bpm * bpmJson[bpmJson.length - 1].value;
        }
    }
}
// function bpmChange(timer){
//     if (chart.bpmShifts.length > 0){

//     }
// }
function riztime(timer){
    if (chart.challengeTimes.length === 1){
        if (timer > chart.challengeTimes[0].start){
                noteColor = chart.themes[1].colorsList[1]
                backGroundColor = chart.themes[1].colorsList[0]
                if (timer > chart.challengeTimes[0].end){
                    noteColor = chart.themes[0].colorsList[1]
                    backGroundColor = chart.themes[0].colorsList[0]
                }
        }
    }
    if (chart.challengeTimes.length > 1){
        if (riztimeNumber < chart.challengeTimes.length){
            if (timer > chart.challengeTimes[riztimeNumber].end){
                noteColor = chart.themes[0].colorsList[1]
                backGroundColor = chart.themes[0].colorsList[0]
                riztimeNumber += 1
            }
            if (timer > chart.challengeTimes[riztimeNumber].start){
                    noteColor = chart.themes[riztimeNumber].colorsList[1]
                    backGroundColor = chart.themes[riztimeNumber].colorsList[0]
            }
        }
    }
}

class Note {
    constructor(i, json) {
        this.noteNumber = i;
        this.time = json.time;
        this.beat = json.beat;
        this.type = json.type;
        this.otherInformations = json.otherInformations;
        this.x = this.beat * canvas.width / 4 - canvas.width / 2;
        this.y = -canvas.height / 2 + canvas.height / 8;
    }
    
    drawNote() {
        if (this.x > canvas.width / 2) {
            this.y += canvas.height / 4;
            this.x -= canvas.width;
        }
        if (this.x < canvas.width) {
            ctx.beginPath();
            ctx.arc(this.x, this.y - Y, 16, 0, Math.PI * 2);
            // ctx.fillStyle = "blue";
            if (this.type === 1){
                ctx.fillStyle = `rgba(255, 255, 255, 255)`;
            } else{
                ctx.fillStyle = `rgba(${noteColor.r}, ${noteColor.g}, ${noteColor.b}, ${noteColor.a})`;
            }
            ctx.fill();
            ctx.strokeStyle = "black";
            ctx.lineWidth = 8;
            ctx.stroke();
        }
    }
    
    playNote(timer) {
        if (timer > this.time) {
            noteI[this.noteNumber] = null;
        }
    }
}

function drawBeatLine() {
    for (let i = 0; i < ((audio.duration / (60 / chart.bPM) * canvas.height / 4) / 4) / (canvas.height / 4); i++) {
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        let x = canvas.width / 2;
        let y = canvas.height / 4 * (i + 1) - canvas.height / 2;
        y -= Y;
        ctx.moveTo(-x, y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    for (let i = 0; i < (audio.duration / (60 / chart.bPM) * canvas.width / 4) / (canvas.width / 4); i++) {
        for (let a = 0; a < 3; a++) {
            ctx.beginPath();
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            let x = -canvas.width / 2 + canvas.width / 4 * (a + 1);
            let y1 = canvas.height / 4 * (i + 1) - canvas.height / 2;
            let y2 = canvas.height / 4 * (i + 1) - canvas.height / 2 - canvas.height / 4;
            y1 -= Y;
            y2 -= Y;
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
            ctx.stroke();
        }
    }
}

class NowBeatLine {
    constructor() {
        this.x = -canvas.width / 2;
        this.x1 = 0;
        this.y1 = -canvas.height / 2;
        this.y2 = this.y1 + canvas.height / 4;
        this.xTotal = 0;
    }
    
    linearInterpolation(s, e, sT, eT, timer) {
        return s + (e - s) * ((timer - sT) / (eT - sT));
    }
    
    drawNowBeatLine() {
        this.xTotal = audio.duration / (60 / chart.bPM) * canvas.width / 4 - canvas.width / 2;
        this.x = this.linearInterpolation(-canvas.width / 2, this.xTotal, 0, audio.duration, audio.currentTime);
        if (this.x - this.x1 * canvas.width > canvas.width / 2) {
            this.y1 += canvas.height / 4;
            this.y2 += canvas.height / 4;
            this.x1 += 1
        }
        this.x -= this.x1 * canvas.width;
        ctx.beginPath();
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 8;
        ctx.moveTo(this.x, this.y1 - Y);
        ctx.lineTo(this.x, this.y2 - Y);
        ctx.stroke()
    }
}

function moveY(timer) {
    function linearInterpolation(s, e, sT, eT, timer) {
        return s + (e - s) * ((timer - sT) / (eT - sT));
    }
    var yTotal = (audio.duration / (60 / chart.bPM) * canvas.height / 4) / 4;
    Y = linearInterpolation(0, yTotal, 0, audio.duration, timer) - canvas.height / 4;
}

function start() {
    nowBeatLineI = new NowBeatLine();
    audio.volume = 0.2;
    audio.play();
    
    // 初始化节拍器变量
    lastBeatIndex = -1;
    currentBeatCount = 0;
    currentMeasure = 1;
    
    update();
}

function update() {
    ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(${backGroundColor.r}, ${backGroundColor.g}, ${backGroundColor.b}, ${backGroundColor.a})`;
    ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    let timer = audio.currentTime;
    riztime(timer)
    
    document.getElementById("chartTime").innerHTML = `谱面时间：${timer.toFixed(3)}`;;

    drawBeatLine();
    moveY(timer);
    
    // 节拍器逻辑
    if (chart) {
        const bpm = chart.bPM;
        const beatInterval = 60 / bpm; // 每拍时长（秒）
        const currentBeatIndex = Math.floor(timer / beatInterval);

        if (currentBeatIndex > lastBeatIndex) {
            lastBeatIndex = currentBeatIndex;
            currentBeatCount = (currentBeatIndex % totalBeatsPerMeasure) + 1;
            currentMeasure = Math.floor(currentBeatIndex / totalBeatsPerMeasure) + 1;

            // 播放音效
            try {
                if (currentBeatCount === 1) {
                    if (!metronomeAudio2.src) {
                        metronomeAudio2.src = "audio/2.wav";
                    }
                    metronomeAudio2.currentTime = 0;
                    metronomeAudio2.play();
                } else {
                    if (!metronomeAudio.src) {
                        metronomeAudio.src = "audio/1.wav";
                    }
                    metronomeAudio.currentTime = 0;
                    metronomeAudio.play();
                }
            } catch (e) {
                console.log("节拍音效播放失败:", e);
            }
        }
    }

    if (noteI.length > 0) {
        for (var i = 0; i < noteI.length; i++) {
            if (noteI[i] != null) {
                noteI[i].drawNote();
                noteI[i].playNote(timer);
            }
        }
    }
    if (nowBeatLineI) nowBeatLineI.drawNowBeatLine();
    
    if (audio.currentTime >= audio.duration) {
        audio.pause();
    }
    
    requestAnimationFrame(update);
}

// FPS计数器
let frameCount = 0;
let lastTime = 0;
function updateFPS() {
    const now = performance.now();
    frameCount++;
    if (now - lastTime >= 1000) {
        document.getElementById('fps').textContent = 'FPS: ' + frameCount;
        frameCount = 0;
        lastTime = now;
    }
    requestAnimationFrame(updateFPS);
}
updateFPS();