module Auth {
  /*
    The user's API secret is stored using chrome.storage.sync.

    The user logs in once with Esper, then the API secret is
    propagated across all Chrome browsers where the user is logged-in
    as a Google Chrome user.
  */

  function sendCredentialsResponse(x: EsperStorage.Credentials) {
    if (/^https:\/\/mail.google.com\//.test(document.URL)) {
      Log.d("Sending message from content script to gmail page", x);
      var esperMessage : EsperMessage.EsperMessage = {
        sender: "Esper",
        type: "CredentialsResponse",
        value: x
      };
      window.postMessage(esperMessage, "*");
    }
  }

  /*
    Send credentials for all Esper accounts because we're not keeping track
    of which account was requested.
  */
  function sendStorage(x: EsperStorage.EsperStorage) {
    if (x !== undefined && x.accounts !== undefined) {
      var accounts = x.accounts;
      for (var k in accounts) {
        sendCredentialsResponse(accounts[k].credentials);
      }
    }
  }

  function openLoginTab(googleAccountId) {
    var url = Conf.Api.url + "/#!login/" + encodeURIComponent(googleAccountId);
    Log.d("Going off to " + url);
    var win = window.open(url, '_blank');
    win.focus();
  }

  function obtainCredentials(googleAccountId) {
    EsperStorage.loadCredentials(googleAccountId,
                                 function(x: EsperStorage.Credentials) {
      if (x !== undefined)
        sendCredentialsResponse(x);
      else
        openLoginTab(googleAccountId);
    });
  }


  function listenForMessages() {
    Log.d("listenForMessages()");
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

        /* Sent by content script itself, ignored. */
        case "CredentialsResponse":
          break;

        /* Listen for logouts from the app.esper.com page */
        case "Logout":
          EsperStorage.deleteCredentials(
            request.value.googleAccountId,
            function() { Log.d("Removed credentials from storage"); }
          );
          break;

        case "ClearSyncStorage":
          EsperStorage.clearAll(function() {
            Log.d("Cleared all sync storage created by the Esper extension");
          });
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
        sendStorage(newStorage);
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
