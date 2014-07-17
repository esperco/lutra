module MsgView {
  /* One of the messages of the thread currently or previously displayed */
  var currentMsgId : string;

  /*
    Warning: what the author of gmail.js calls "threads" is usually
             single messages. Go figure.
             Proper thread IDs are not available from the gmail.js environment.
   */

  /* We do something if we detect a new msg ID. */
  function maybeUpdateView(maxRetries) {
    Log.d("maybeUpdateView("+maxRetries+")");
    var emailData = gmail.get.email_data();
    if (emailData !== undefined && emailData.total_threads !== undefined) {
      var msgIds = emailData.total_threads;
      if (msgIds.length === 0)
        Log.e("No messages");
      else {
        var msgId = msgIds[0];
        if (currentMsgId !== msgId) {
          currentMsgId = msgId;
          Log.d("Using new thread representative " + currentMsgId
                + ": " + emailData.threads[currentMsgId].subject);
        }
      }
    }
    else {
      /* retry every second, up to 10 times. */
      if (maxRetries > 0)
        setTimeout(maybeUpdateView, 1000, maxRetries - 1);
    }
  }

  function listen() {
    gmail.on.open_email(function(id, url, body) {
      Log.d("Opened email " + id);
      maybeUpdateView(10);
    });
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      alreadyInitialized = true;
      Log.d("MsgView.init()");
      listen();
      maybeUpdateView(10);
    }
  }
}
