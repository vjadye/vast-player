var videoElement;
// Define a variable to track whether there are ads loaded and initially set it to false
var adsLoaded = false;
var adContainer;
var adDisplayContainer;
var adsLoader;
var adsManager;

var vastUrl;
var vastBody;

function buttonAction(event, videoElement, playStateButton) {
    console.log(playStateButton.textContent);
    switch (playStateButton.textContent) {
        case 'Play':
            playStateButton.textContent = 'Pause';
            videoElement.play();
            break;
        case 'Pause':
            playStateButton.textContent = 'Resume';
            if (adsManager.getRemainingTime() == -1) {
                videoElement.pause();
            } else {
                adsManager.pause();
            }
            break;
        case 'Resume':
            playStateButton.textContent = 'Pause';
            if (adsManager.getRemainingTime() == -1) {
                videoElement.play();
            } else {
                adsManager.resume();
            }
            break;
    }
}

function getVerifiedHttpsUrl(str) {
    try {
        var tempUrl = new URL(str);
        if (tempUrl.protocol === 'http:') {
            tempUrl.protocol = 'https:';
        }
        if (tempUrl.protocol === 'https:') {
          return tempUrl.toString();
        }
    } catch (err) {
        console.log("this is not a valid url");
    }
}

window.addEventListener('load', function(event) {
  videoElement = document.getElementById('video-element');
  videoElement.addEventListener('play', function(event) {
    console.log("play event for video element : " + JSON.stringify(event));
    loadAds(event);
  });
  var playStateButton = document.getElementById('play-state-button');
  playStateButton.addEventListener('click', (event) => buttonAction(event, videoElement, playStateButton));

  var vastInput = document.getElementById('vast-input');
  vastInput.addEventListener('keypress', (event) => {
    if (event.keyCode == 13) {
         var vastUrlOrBody = vastInput.value;
         console.log("VAST input enter key is pressed with content: " + vastUrlOrBody);

         var verifiedHttpsUrl = getVerifiedHttpsUrl(vastUrlOrBody);
         console.log("verifiedHttpsUrl: " + verifiedHttpsUrl);
         if (verifiedHttpsUrl !== undefined) { // url
            vastUrl = verifiedHttpsUrl;
            initializeIMA();
         } else {
            // TODO : add VAST validation
            vastBody = vastUrlOrBody;
            console.log(vastUrl);
            initializeIMA();
         }
         vastInput.style.display = 'none';
         playStateButton.style.display = 'block';
         videoElement.style.display = 'block';
    }
  });
});

window.addEventListener('resize', function(event) {
  console.log("window resized");
  if(adsManager) {
      var width = videoElement.clientWidth;
      var height = videoElement.clientHeight;
      adsManager.resize(width, height, google.ima.ViewMode.NORMAL);
  }
});

function initializeIMA() {
  console.log("initializing IMA");
  adContainer = document.getElementById('ad-container');
  adContainer.addEventListener('click', adContainerClick);
  adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, videoElement);
    adsLoader = new google.ima.AdsLoader(adDisplayContainer);
    adsLoader.addEventListener(
          google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
          onAdsManagerLoaded,
          false);
    adsLoader.addEventListener(
          google.ima.AdErrorEvent.Type.AD_ERROR,
          onAdError,
          false);

    // Let the AdsLoader know when the video has ended
    videoElement.addEventListener('ended', function() {
      adsLoader.contentComplete();
    });

    var adsRequest = new google.ima.AdsRequest();
    /*
    adsRequest.adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?' +
        'iu=/21775744923/external/single_ad_samples&sz=640x480&' +
        'cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&' +
        'gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=';
    */

    adsRequest.adTagUrl = vastUrl;
    adsRequest.adsResponse = vastBody;

    // Specify the linear and nonlinear slot sizes. This helps the SDK to
    // select the correct creative if multiple are returned.
    adsRequest.linearAdSlotWidth = videoElement.clientWidth;
    adsRequest.linearAdSlotHeight = videoElement.clientHeight;
    adsRequest.nonLinearAdSlotWidth = videoElement.clientWidth;
    adsRequest.nonLinearAdSlotHeight = videoElement.clientHeight / 3;

    // Pass the request to the adsLoader to request ads
    adsLoader.requestAds(adsRequest);
}

function loadAds(event) {
  // Prevent this function from running on if there are already ads loaded
  if(adsLoaded) {
    return;
  }
  adsLoaded = true;

  // Prevent triggering immediate playback when ads are loading
  event.preventDefault();

  console.log("loading ads");

  // Initialize the container. Must be done via a user action on mobile devices.
    videoElement.load();
    adDisplayContainer.initialize();

    var width = videoElement.clientWidth;
    var height = videoElement.clientHeight;
    try {
      adsManager.init(width, height, google.ima.ViewMode.NORMAL);
      adsManager.start();
    } catch (adError) {
      // Play the video without ads, if an error occurs
      console.log("AdsManager could not be started");
      videoElement.play();
    }
}

function onAdsManagerLoaded(adsManagerLoadedEvent) {
  // Instantiate the AdsManager from the adsLoader response and pass it the video element
  adsManager = adsManagerLoadedEvent.getAdsManager(
      videoElement);
  adsManager.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR,
        onAdError);
  adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
        onContentPauseRequested);
  adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
        onContentResumeRequested);


}

function onAdError(adErrorEvent) {
  console.log("onAdError");
  // Handle the error logging.
  console.log(adErrorEvent.getError());
  if(adsManager) {
    adsManager.destroy();
  }
}

function onContentPauseRequested() {
  console.log("content pause requested");
  videoElement.pause();
}

function onContentResumeRequested() {
  console.log("content resume requested");
  videoElement.play();
}

function adContainerClick(event) {
  console.log("ad container clicked");

  var playStateButton = document.getElementById('play-state-button');
  playStateButton.textContent = 'Resume';
}