/*
  Start/stop timers and send data to the server:
  - when a new task is started, stopping the previous one
  - when enough time has passed since the last time the data was sent
    to the server for the current task (each time, the time interval
    associated with the current task is extended)
*/
module Esper.TimeTracker {
  var currentTask: string; /* task ID */
  var startTimeMs: number;

  var flushIntervalMs = 120000; /* 2 min */
  var checkIntervalMs = 30000;  /* 30 s */

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
    var startTimeSec = toSeconds(startTimeMs);
    var elapsed = toSeconds(Date.now());
    Log.d("Sending time tracking data to server:"
          + " task " + currentTask
          + " started " + startTimeSec
          + " elapsed " + elapsed);
  }

  function clear() {
    currentTask = undefined;
    startTimeMs = undefined;
  }

  function flush() {
    if (currentTask !== undefined) {
      sendToServer();
    }
  }

  function maybeFlush() {
    if (currentTask !== undefined) {
      console.assert(startTimeMs !== undefined);
      if (Date.now() - startTimeMs >= flushIntervalMs) {
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

  export function stop() {
    var taskid = currentTask;
    if (taskid !== undefined)
      flush();
    clear();
  }

  export function start(taskid: string) {
    console.assert(taskid !== undefined);
    if (currentTask !== undefined)
      flush();
    currentTask = taskid;
    startTimer();
  }

  export function init() {
    checkPeriodically();
  }
}
