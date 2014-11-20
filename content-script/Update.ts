module Esper.Update {
  /*
     Invite the user to reload the page when a new version of the extension
     is available in the browser but the current page is loaded with
     an older version.

     Using the same version of the Esper extension between Google Calendar
     and Gmail is required for those to communicate.
     Communication between Gmail and Calendar is needed to exchange
     the recently visited threads and events.
  */

  function inviteToReload(version: string) {
    $("#esper-reload-banner").remove();
'''
<div #view
     id="esper-reload-banner"
     class="esper-reload-banner">
  A new version of Esper is available.
  <a #reload
     href="#"
     class="esper-link"
     title="Reload page">Reload now</a> for best results.
  <a #dismiss
     href="#"
     class="esper-link">Dismiss ×</span>
</div>
'''
    reload.click(function() { location.reload(); });
    dismiss.click(function() { view.remove(); });
    $("body").append(view);
  }

  export function init() {
    Log.d("Update.init(): chrome.runtime.onMessage.addListener");
    chrome.runtime.onMessage.addListener(function(message: Message.Message) {
      Log.d("Got a message: ", message);
      if (message !== undefined && message !== null
          && message.sender === "Esper"
          && message.type === "UpdateAvailable") {
        var version: string = message.value;
        inviteToReload(version);
      }
    });
  }
}
