function sendMessageToActiveTab(message, callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, message, callback);
  });
};


window.onload = function () {
  enabled = document.getElementById('enabled');

  pitch = document.getElementById('pitch');
  pitchValue = document.getElementById('pitch-value');
  pitchReset = document.getElementById('pitch-reset');

  playbackRate = document.getElementById('playback-rate');
  playbackRateValue = document.getElementById('playback-rate-value');
  playbackRateReset = document.getElementById('playback-rate-reset');

  function setPitchValue(_pitchValue) {
    pitch.value = _pitchValue.toString();
    pitchValue.textContent = _pitchValue;
  }

  function setPlaybackRate(_playbackRate) {
    playbackRate.value = _playbackRate.toString();
    playbackRateValue.textContent = _playbackRate;
  }

  sendMessageToActiveTab({type: 'get'}, function (values) {
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

