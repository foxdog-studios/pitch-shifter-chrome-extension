var _audioCtx = null;
var _jungle = null;
var _outputNode = null;

var videoConnected = false;
var _previousPlaybackRate = 1;
var _previousPitch = 0;

var transpose = false;

function getAudioContext() {
  if (!_audioCtx) {
    _audioCtx = new AudioContext();
  }
  return _audioCtx;
}

function getJungle() {
  if (!_jungle) {
    _jungle = new Jungle(getAudioContext());
  }
  return _jungle;
}

function getOutputNode(video) {
  if (!_outputNode) {
    audioCtx = getAudioContext();
    _outputNode = audioCtx.createMediaElementSource(video);
  }
  return _outputNode;
}

function connectVideo(video) {

  var audioCtx = getAudioContext();
  if (_outputNode !== undefined && _outputNode !== null) {
    _outputNode.disconnect(audioCtx.destination);
  }
  var outputNode = getOutputNode(video);
  var jungle = getJungle();

  outputNode.connect(jungle.input);
  jungle.output.connect(audioCtx.destination);

  jungle.setPitchOffset(_previousPitch, transpose);
  video.playbackRate = _previousPlaybackRate;
}

function disconnectVideo(video) {
  var audioCtx = getAudioContext();
  var outputNode = getOutputNode(video);
  var jungle = getJungle();

  outputNode.disconnect(jungle.input);
  jungle.output.disconnect(audioCtx.destination);
  outputNode.connect(audioCtx.destination);
  video.playbackRate = 1;
}

_observer = null;
videoEl = null;

function initVideoObservers() {
  _observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes !== undefined && mutation.addedNodes !== null) {
        for (var i = 0; i < mutation.addedNodes.length; ++i) {
          var node = mutation.addedNodes[i];
          // Dom has changed so try and get the video element again.
          newVideoEl = document.querySelector('video');
          if (videoEl !== newVideoEl) {
            if (videoConnected) {
              disconnectVideo(videoEl);
            }
            videoConnected = true;
            videoEl = newVideoEl;
            connectVideo(newVideoEl)
          }
        }
      }
      if (videoEl) {
        // XXX: Don't do this on every mutation.
        //
        //      We set the playbackRate as otherwise it is forgotten when
        //      a video changes in youtube.
        videoEl.playbackRate = _previousPlaybackRate;
      }
    });
  });

  var observerConfig = {
    attributes: true,
    childList: true,
    characterData: true
  };

  var targetNode = document.body;
  _observer.observe(targetNode, observerConfig);

  // Try get the video element.
  videoEl = document.querySelector('video');
  if (videoEl) {
    videoConnected = true;
    connectVideo(videoEl);
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === 'get') {
    response = {};
    response.playbackRate = _previousPlaybackRate;
    response.pitch = _previousPitch;
    response.enabled = videoConnected;
    response.transpose = transpose;
    sendResponse(response);
  }

  if (request.enabled !== undefined && request.enabled !== null) {
    if (request.enabled) {
      initVideoObservers();
    } else if (!request.enabled && videoConnected) {
      if (_observer !== undefined && _observer !== null) {
        _observer.disconnect();
        _observer = null;
      }
      videoConnected = false;
      disconnectVideo(videoEl);
    }
  }

  if (!videoEl) {
    return;
  }

  if (request.transpose !== undefined && request.transpose !== null) {
    transpose = request.transpose;
  }

  if (request.pitch !== undefined && request.pitch !== null) {
    _previousPitch = request.pitch;
    getJungle().setPitchOffset(request.pitch, transpose);
  }

  if (request.playbackRate !== undefined && request.playbackRate !== null) {
    if (videoEl !== undefined && videoEl !== null) {
      _previousPlaybackRate = request.playbackRate;
      videoEl.playbackRate = request.playbackRate;
    }
  }


});

