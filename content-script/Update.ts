/// <reference path="../common/Message.Chrome.ts" />

module Esper.Update {
  /*
     Invite the user to reload the page when a new version of the extension
     is available in the browser but the current page is loaded with
     an older version.
  */

  function inviteToReload() {
    $("#esper-reload-banner").remove();
'''
<div #view id="esper-reload-banner">
  A new version of Esper is available.
  <a #reload href="#" title="Reload page" class="esper-link">
    Click here to reload and install.
  </a>
  <a #dismiss id="esper-dismiss" class="esper-link"  href="#">
    &times;
  </a>
</div>
'''
    reload.click(function() { location.reload(); });
    dismiss.click(function() { view.remove(); });
    $("body").append(view);
  }

  // Track whether we've asked user to reload already. Don't ask twice.
  var alreadyAsked = false;

  export function init() {
    Log.d("Update.init(): listening to extension");

    // Post a request on init and update based on response
    Message.postToExtension(Message.Type.RequestExtensionUpdate, null,
      (response: string) => {
        if (response === "update_available") {
          if (!alreadyAsked &&
              (HostUrl.isGmail(location.href) ||
               HostUrl.isGcal(location.href)))
          {
            inviteToReload();
            alreadyAsked = true;
          }
        }
      });
  }
}
