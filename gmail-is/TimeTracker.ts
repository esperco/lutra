/*
  Start/stop timers and send data to the server:
  - when a new task is started, stopping the previous one
  - when enough time has passed since the last time the data was sent
    to the server for the current task (each time, the time interval
    associated with the current task is extended)
*/
module Esper.TimeTracker {
  var flushIntervalMs = 120000; /* 2 min */
  var checkIntervalMs = 30000;  /* 30 s */

  if (!Conf.prod) {
    /* Reduce delays for faster testing */
    flushIntervalMs = 30000;
    checkIntervalMs = 5000;
  }

  /* The state of the time tracker */
  var currentTask: string; /* task ID */
  var startTimeMs: number;
  var lastFlushMs: number;
  var extraDurationMs: number; /* positive or negative */
  /*
    Stopped: current task undefined, start time undefined
    Running: current task defined, start time defined
    Paused: current task defined, start time undefined
    illegal state: current task undefined, start time defined
   */

  function isStopped() {
    return currentTask === undefined;
  }

  function isRunning() {
    return currentTask !== undefined && startTimeMs !== undefined;
  }

  function isPaused() {
    return currentTask !== undefined && startTimeMs === undefined;
  }


  function startTimer() {
    startTimeMs = Date.now();
  }

  function toSeconds(ms: number) {
    return Math.floor(ms/1000);
  }

  /*
    A given time interval can be extended by submitting the same task
    ID with the same start date later.
   */
  function sendToServer() {
    if (Login.loggedIn()) {
      var startTimeSec = toSeconds(startTimeMs);
      var elapsed =
        Math.max(0, toSeconds(Date.now()) - startTimeSec
                 + toSeconds(extraDurationMs));
      Log.d("Sending time tracking data to server:"
            + " task " + currentTask
            + " started " + startTimeSec
            + " elapsed " + elapsed);
      Api.trackTask(currentTask, startTimeSec, elapsed);
    }
    else {
      Log.e("Logged out. Can't send time tracking data to server.");
    }
  }

  function clear() {
    currentTask = undefined;
    startTimeMs = undefined;
    extraDurationMs = 0;
  }

  function flush() {
    if (isRunning()) {
      sendToServer();
    }
  }

  function maybeFlush() {
    if (isRunning()) {
      var now = Date.now();
      var last = startTimeMs;
      if (lastFlushMs > startTimeMs)
        last = lastFlushMs;
      if (now - last >= flushIntervalMs) {
        lastFlushMs = now;
        flush();
      }
    }
  }

  function checkPeriodically() {
    function iteration() {
      setTimeout(iteration, checkIntervalMs);
      maybeFlush();
    }
    iteration();
  }

  var initialized = false;
  function initIfNeeded() {
    if (! initialized) {
      initialized = true;
      checkPeriodically();
    }
  }

  export function stop() {
    var taskid = currentTask;
    if (taskid !== undefined) {
      Log.d("Stop " + currentTask);
      flush();
    }
    clear();
    console.assert(isStopped());
  }

  /* Start a timer for the given task unless one already exists. */
  export function start(taskid: string) {
    initIfNeeded();
    console.assert(taskid !== undefined);
    if (isRunning() && currentTask === taskid)
      /* let it run */;
    else {
      stop();
      currentTask = taskid;
      startTimer();
      Log.d("Start " + taskid);
    }
    console.assert(isRunning());
  }

  export function pause(extraMs = 0) {
    /* extraMs is used to add or subtract some time. */
    if (isRunning()) {
      var taskid = currentTask;
      extraDurationMs = extraMs;
      stop();
      currentTask = taskid;
      Log.d("Paused " + currentTask);
      console.assert(isPaused());
    }
  }

  /* Resume from paused state if applicable, otherwise do nothing. */
  export function resume() {
    if (isPaused())
      start(currentTask);
  }
}
