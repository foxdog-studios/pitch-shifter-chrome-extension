var _audioCtx = null;
var _jungle = null;
var _previousPlaybackRate = 1;
var _previousPitch = 0;

var transpose = false;

let videoConnected = false;

function getAudioContext() {
  if (!_audioCtx) {
    _audioCtx = new AudioContext();
  }
  return _audioCtx;
}

function getJungle() {
  if (!_jungle) {
    const audioCtx = getAudioContext();
    _jungle = new Jungle(audioCtx);
    _jungle.output.connect(audioCtx.destination);
  }
  return _jungle;
}

const outputNodeMap = new Map();

function getOutputNode(video) {
  let outputNode = outputNodeMap.get(video);

  if (outputNode === undefined) {
    const audioCtx = getAudioContext();
    outputNode = {
      outputNode: audioCtx.createMediaElementSource(video),
      destinationConnected: false,
      pitchShifterConnected: false,
    };
    outputNodeMap.set(video, outputNode);
  }

  return outputNode;
}

function connectVideo(video) {
  const nodeData = getOutputNode(video);

  const outputNode = nodeData.outputNode;

  var jungle = getJungle();
  if (!nodeData.pitchShifterConnected) {
    outputNode.connect(jungle.input);
    nodeData.pitchShifterConnected = true;
  }

  if (nodeData.destinationConnected) {
    const audioCtx = getAudioContext();
    outputNode.disconnect(audioCtx.destination);
    nodeData.destinationConnected = false;
  }

  jungle.setPitchOffset(_previousPitch, transpose);
  video.playbackRate = _previousPlaybackRate;
  videoConnected = true;
}

function disconnectVideo(video) {
  const audioCtx = getAudioContext();
  
  var jungle = getJungle();

  const nodeData = getOutputNode(video);

  const outputNode = nodeData.outputNode;

  if (nodeData.pitchShifterConnected) {
    outputNode.disconnect(jungle.input);
    nodeData.pitchShifterConnected = false;
  }

  if (!nodeData.destinationConnected) {
    outputNode.connect(audioCtx.destination);
    nodeData.destinationConnected = true;
  }

  video.playbackRate = 1;
}


const videoListeners = new Map();

function disconnectAllVideos() {
  outputNodeMap.forEach((_nodeData, video) => {
    disconnectVideo(video);
  });

  videoListeners.forEach((listener, video) => {
    video.removeEventListener('playing', listener);
  });
  videoConnected = false;
}

_observer = null;

/**
 * @param {HTMLVideoElement} newVideoEl
 */
const changeVideo = (newVideoEl) => {
  connectVideo(newVideoEl)
}


/**
 * @param {HTMLVideoElement} video
 */
const isVideoPlaying = video => !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);


/**
 * @param {HTMLVideoElement} listenVideoEl
 */

const listenForPlay = (listenVideoEl) => {
  const listener = videoListeners.get(listenVideoEl);
  if (listener === undefined) {
    const listenerCallback = () => {
      changeVideo(listenVideoEl);
    };
    listenVideoEl.addEventListener('playing', listenerCallback);
    videoListeners.set(listenVideoEl, listenerCallback);
  }

  if (isVideoPlaying(listenVideoEl)) {
    changeVideo(listenVideoEl);
  }
}

function initVideoObservers() {
  _observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes !== undefined && mutation.addedNodes !== null) {
        for (var i = 0; i < mutation.addedNodes.length; ++i) {
          var newVideoEl = mutation.addedNodes[i];
          // Dom has changed so try and get the video element again.
          if (!(newVideoEl instanceof HTMLVideoElement)) {
            if (newVideoEl.querySelectorAll !== undefined) {
              newVideoEl.querySelectorAll('video').forEach((v) => {
                listenForPlay(v);
              });
            }
            return;
          }
          listenForPlay(newVideoEl);
        }
      }
    });
  });

  var observerConfig = {
    childList: true,
    subtree: true,
  };

  var targetNode = document.body;
  _observer.observe(targetNode, observerConfig);

  // Try get the video element.
  videoEls = document.querySelectorAll('video');
  videoEls.forEach((v) => {
    if (v instanceof HTMLVideoElement) {
      listenForPlay(v);
    }
  });
}

chrome.runtime.onMessage.addListener(function(request, _sender, sendResponse) {
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
      disconnectAllVideos();
    }
  }

  if (request.transpose !== undefined && request.transpose !== null) {
    transpose = request.transpose;
  }

  if (request.pitch !== undefined && request.pitch !== null) {
    _previousPitch = request.pitch;
    getJungle().setPitchOffset(request.pitch, transpose);
  }

  if (request.playbackRate !== undefined && request.playbackRate !== null) {
    _previousPlaybackRate = request.playbackRate;
    outputNodeMap.forEach((_nodeData, video) => {
      video.playbackRate = request.playbackRate;
    });
  }
});

