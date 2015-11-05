/*
  Module with code for posting an anonymous analytics request to esper.com
  via a hidden iFrame.
*/

/// <reference path="../typings/lodash/lodash.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="./Analytics.ts" />
/// <reference path="./JQStore.ts" />

module Esper.Analytics {
  // Set this to the writeKey we want to use for the current project
  export var writeKey: string;

  // Setting variable (tweak for testing)
  var iframeOrigin = "https://esper.com";

  interface AnalyticsMessage {
    page?: string;
    event?: string;
    properties?: any;
  }

  // Reference to current active iFrame (will be cleared if iFrame is
  // removed from DOM)
  var currentFrame = new JQStore();

  // A list of queued analytics calls to make when ready
  var callQueue: AnalyticsMessage[] = [];

  export function trackViaIframe(event: Trackable, properties?: any) {
    callQueue.push({
      event: Trackable[event],
      properties: properties
    });
    initEventListener();
  }

  export function pageViaIframe(page: Page, properties?: any) {
    // Initialize some properties set from the current page (rather than the
    // esper.com/analytics page we're going to call
    properties = properties || {};
    properties.title = document.title;
    properties.url = document.URL;
    properties.referrer = document.referrer;
    properties.path = location.pathname;

    callQueue.push({
      page: Page[page],
      properties: properties
    });
    initEventListener();
  }

  var eventListenerReady = false;
  function initEventListener() {
    loadFrame();
    if (! eventListenerReady) {
      window.addEventListener("message", function(ev) {
        // Only listen to API host Esper messages
        if (ev.data && ev.data.sender === "Esper Analytics") {
          if (ev.data.type === "Ready") {  // iFrame ready => post request
            postToFrame();
          }
        }
      });
    } else {
      postToFrame(); // Listener already loaded => empty queue again
    }
    eventListenerReady = true;
  }

  // Stick invisible iFrame somewhere in body
  function loadFrame() {
    if (! currentFrame.get()) {
      var src = iframeOrigin + "/analytics?writeKey=" +
        encodeURIComponent(writeKey);
      var frame = $(`<iframe src=${src} style="display:none" />`);
      frame.appendTo('body');
      currentFrame.set(frame);
    }
  }

  // Post queued messages to our iFrame
  function postToFrame() {
    var frameElm = <HTMLIFrameElement> currentFrame.get().get(0);
    _.each(callQueue, (call) => {
      frameElm.contentWindow.postMessage({
        sender: "Esper",
        type: "Analytics",
        value: call
      }, iframeOrigin);
    });

    // Empty queue
    callQueue = [];
  }
}