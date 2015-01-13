/*
  Detect mouse/keyboard inactivity
*/
module Esper.Inactivity {
  var timer;
  var lastActive = 0;

  var expireAfterMs = 20000 //300000; /* 5 min */
  var granularityMs = 5000 //10000;  /* 10 s */

  function signalInactivity() {
    Log.d("Are you still there?");
  }

  function updateInactivityTimer() {
    if (timer !== undefined)
      clearTimeout(timer);
    timer = setTimeout(signalInactivity, expireAfterMs);
  }

  /*
    The 2 following functions markActive and waitForActivity are in charge
    of maintaining the lastActive timestamp in a way that doesn't use
    too much CPU.
    (sleep 10 seconds, wait for mouse movement, sleep 10 s, etc.)
  */
  function markActive() {
    Log.d("markActive");
    lastActive = Date.now();
    setTimeout(waitForActivity, granularityMs);
    updateInactivityTimer();
  }

  function waitForActivity() {
    Log.d("waitForActivity");
    $(window).one("mousemove", markActive);
  }

  export function init() {
    markActive();
  }
}
