/*
  Detect mouse/keyboard inactivity
*/
module Esper.Inactivity {
  var timer;
  var lastActive = 0;

  var expireAfterMs = 300000; /* 5 min */
  var granularityMs = 10000;  /* 10 s */

  if (!Conf.prod) {
    /* Reduce delays for faster testing */
    expireAfterMs = 20000;
    granularityMs = 5000;
  }

  function signalInactivity() {
    /*
      We could ask the user something like "Are you still there?"
      and if they answer "no", we don't bill those last few minutes.
      This is a refinement. Let's do this later if necessary.
    */
    Log.d("No activity detected. Pausing time tracker.");
    TimeTracker.pause();
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
    TimeTracker.resume();
    lastActive = Date.now();
    setTimeout(waitForActivity, granularityMs);
    updateInactivityTimer();
  }

  function waitForActivity() {
    Log.d("waitForActivity");
    $(window).one("mousedown", markActive);
  }

  var initialized = false;
  export function init() {
    if (! initialized) {
      initialized = true;
      markActive();
      CurrentThread.task.watch(
        function(task: ApiT.Task, isValid: boolean,
                 oldTask: ApiT.Task, oldIsValid: boolean) {
          if (isValid)
            TimeTracker.start(task.taskid);
          else
            TimeTracker.stop();
        }
      );
    }
  }
}
