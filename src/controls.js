function sendMessageToActiveTab(message, callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, message, callback);
  });
};


function init() {
  var transpose = false;

  var enabled = document.getElementById('enabled');

  var pitch = document.getElementById('pitch');
  var pitchValue = document.getElementById('pitch-value');
  var pitchShiftTypeSelect = document.getElementById('pitch-shift-type');
  var pitchReset = document.getElementById('pitch-reset');

  var playbackRate = document.getElementById('playback-rate');
  var playbackRateValue = document.getElementById('playback-rate-value');
  var playbackRateReset = document.getElementById('playback-rate-reset');

  function setPitchValue(_pitchValue) {
    pitch.value = _pitchValue;
    console.log(pitch.value, _pitchValue);
    pitchValue.textContent = _pitchValue;
  }

  function setPlaybackRate(_playbackRate) {
    playbackRate.value = _playbackRate;
    playbackRateValue.textContent = _playbackRate;
  }

  function setPitchShiftTypeSmooth() {
    pitch.max = 1;
    pitch.min = -1;
    pitch.step = 0.01;
    pitchShiftTypeSelect.selectedIndex = 0;
    transpose = false;
  }

  function setPitchShiftTypeSemiTone() {
    console.log('setting max min');
    pitch.max = 12;
    pitch.min = -12;
    pitch.step = 1;
    pitchShiftTypeSelect.selectedIndex = 1;
    transpose = true;
  }

  sendMessageToActiveTab({type: 'get'}, function (values) {
    if (values.transpose !== undefined && values.transpose !== null) {
      if (values.transpose) {
        setPitchShiftTypeSemiTone();
      } else {
        setPitchShiftTypeSmooth();
      }
    }
    if (values.pitch !== undefined && values.pitch !== null) {
      setPitchValue(values.pitch);
    }
    if (values.playbackRate !== undefined && values.playbackRate !== null) {
      setPlaybackRate(values.playbackRate);
    }
    if (values.enabled !== undefined && values.enabled !== null) {
      enabled.checked = values.enabled;
    }

  });

  enabled.addEventListener('change', function(event) {
    sendMessageToActiveTab({enabled: enabled.checked});
  }, false);

  pitch.addEventListener('input', function(event) {
    sendMessageToActiveTab({pitch: pitch.value});
    setPitchValue(pitch.value);
  }, false);

  pitchShiftTypeSelect.addEventListener('change', function(event) {
    var opt = pitchShiftTypeSelect.options[pitchShiftTypeSelect.selectedIndex]
    if (opt.value == 'smooth') {
      setPitchShiftTypeSmooth();
      setPitchValue(0);
    } else if (opt.value == 'semi-tone') {
      setPitchShiftTypeSemiTone();
      setPitchValue(0);
    }
    sendMessageToActiveTab({transpose: transpose, pitch: pitch.value});
  }, false);

  pitchReset.addEventListener('click', function(event) {
    sendMessageToActiveTab({pitch: 0});
    setPitchValue(0);
  }, false);

  playbackRate.addEventListener('input', function(event) {
    sendMessageToActiveTab({playbackRate: playbackRate.value});
    setPlaybackRate(playbackRate.value);
  }, false);

  playbackRateReset.addEventListener('click', function(event) {
    sendMessageToActiveTab({playbackRate: 1});
    setPlaybackRate(1);
  }, false);
}

var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete") {
        clearInterval(readyStateCheckInterval);
        init();
    }
}, 10);
