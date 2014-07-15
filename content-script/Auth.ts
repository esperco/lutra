module Auth {
  /*
    The user's API secret is stored using chrome.storage.sync.

    The user logs in once with Esper, then the API secret is
    propagated across all Chrome browsers where the user is logged-in
    as a Google Chrome user.
  */

  function sendResponse(x: EsperStorage.EsperStorage) {
    if (/^https:\/\/mail.google.com\//.test(document.URL)) {
      Log.d("Sending message from content script to gmail page", x);
      var esperMessage : EsperMessage.EsperMessage = {
        sender: "Esper",
        type: "EsperStorage",
        value: x
      };
      window.postMessage(esperMessage, "*");
    }
  }

  function obtainCredentials(googleAccountId) {
    EsperStorage.loadCredentials(googleAccountId, function(x) {
      if (x !== undefined)
        sendResponse(x);
      else
        Log.d("TODO: initiate Google Oauth sign-in");
    });
  }


  function listenForMessages() {
    Log.d("listenForCredentials()");
    window.addEventListener("message", function(event) {
      var request = event.data;
      if (request.sender === "Esper") {
        Log.d("Received message:", event.data);
        switch (request.type) {

        /* Listen for Esper credentials posted by an app.esper.com page. */
        case "Credentials":
          EsperStorage.saveCredentials(
            request.value,
            function() { Log.d("Received and stored credentials"); }
          );
          break;

        /* Listen for request from the injected script at mail.google.com */
        case "CredentialsRequest":
          obtainCredentials(request.value);
          break;

        default:
          Log.d("Unknown request type: " + request.type);
        }
      }
    });
  }

  /* Listen for change in synchronized storage, including the case
     of a successful oauth authentication on another window or tab
     requested previously. */
  function listenForCredentialsChange() {
    Log.d("listenForCredentialsChange()");
    EsperStorage.listenForChange(function(oldStorage, newStorage) {
      if (newStorage !== undefined) {
        sendResponse(newStorage);
      }
    });
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      alreadyInitialized = true;
      listenForMessages();
      listenForCredentialsChange();
    }
  }
}
