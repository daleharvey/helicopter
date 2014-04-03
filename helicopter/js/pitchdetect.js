var audioContext = new AudioContext();
var analyser = null;
var confidence = 0;
var currentPitch = 0;
var  mediaStreamSource = null;


function error() {
    alert('Stream generation failed.');
}

function getUserMedia(dictionary, callback) {
    try {
        navigator.getUserMedia =
            navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia;
        navigator.getUserMedia(dictionary, callback, error);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}

function gotStream(stream) {

    // Create an AudioNode from the stream.
    if (mediaStreamSource === null){
        mediaStreamSource = audioContext.createMediaStreamSource(stream);
    }
    // Connect it to the destination.
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    mediaStreamSource.connect(analyser);
    //updatePitch();
}

var new_analyzer = function(){
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    mediaStreamSource.connect(analyser);
};

function toggleLiveInput() {
    getUserMedia({audio: true}, gotStream);
}

var init = function(){

};


var buflen = 2048;
var buf = new Uint8Array(buflen);


function autoCorrelate(buf, sampleRate) {
    var MIN_SAMPLES = 4;	// corresponds to an 11kHz signal
    var MAX_SAMPLES = 1000; // corresponds to a 44Hz signal
    var SIZE = 1000;
    var best_offset = -1;
    var best_correlation = 0;
    var rms = 0;

    confidence = 0;
    currentPitch = 0;

    if (buf.length < (SIZE + MAX_SAMPLES - MIN_SAMPLES))
        return 0;  // Not enough data

    for (var i = 0; i < SIZE; i++) {
        var val = (buf[i] - 128) / 128;
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    for (var offset = MIN_SAMPLES; offset <= MAX_SAMPLES; offset++) {
        var correlation = 0;

        for (var i = 0; i < SIZE; i++) {
            correlation += Math.abs(((buf[i] - 128) / 128) - ((buf[i + offset] - 128) / 128));
        }
        correlation = 1 - (correlation / SIZE);
        if (correlation > best_correlation) {
            best_correlation = correlation;
            best_offset = offset;
        }
    }

    if ((rms > 0.01) && (best_correlation > 0.01)) {
        confidence = best_correlation * rms * 10000;
        currentPitch = sampleRate / best_offset;
        console.log(currentPitch);

    }

    return currentPitch;


}

function updatePitch(time) {
    //new_analyzer();
    analyser.getByteTimeDomainData(buf);
    pitch = autoCorrelate(buf, audioContext.sampleRate);
    //toggleLiveInput();
    return pitch;


}
