module Esper.Init {
  export var esperRootUrl : string;
    /* URL prefix to access files provided by the extension.
       Sample usage:
         img.attr("src", esperRootUrl + "img/icon.png");
     */

  export var loginInfo : ApiT.LoginResponse;
    /* List of teams, etc; refreshed when credentials change */

  /*
    Retrieve UID and API secret from the content script,
    if they're available. The content script first checks if they are available
    in sync storage.

    If not, it will open a browser pop-up
    for Google sign-in that passes login details to the landing page
    app.esper.com.

    The reason for going through the content script is that the oauth
    landing URL cannot be gmail (well, maybe we could use
    https://mail.google.com/mail/u/0/#esper/token/XXXX
    but this solution comes with a bunch of assumptions and possible
    complications).
  */
  function obtainCredentials() {
    // TODO: adapt this for Google Calendar.
/*
    var googleAccountId = gmail.get.user_email();
    Log.d("Google account ID: " + googleAccountId);
    var esperMessage : EsperMessage.EsperMessage = {
      sender: "Esper",
      type: "CredentialsRequest",
      value: googleAccountId
    };
    window.postMessage(esperMessage, "*");
*/
  }

  function injectLoginControls() {
    Log.d("injectLoginControls()");
  }

  function injectEsperControls() {
    Login.printStatus();
    if (! Login.loggedIn())
      injectLoginControls();
    else
      CalEventView.init();
  }

  /*
    Check if the credentials we received from the content script
    match the current gmail user.
  */
  function filterCredentials(cred: EsperStorage.Credentials) {
    // TODO: adapt for Google Calendar
/*
    var googleAccountId = gmail.get.user_email();
    if (cred !== undefined && cred.googleAccountId === googleAccountId) {
      Login.credentials = cred;
      Api.getLoginInfo()
        .done(function(loginInfo) {
          Login.info = loginInfo;
          injectEsperControls();
        });
    }
*/
  }

  function listenForMessages() {
    Log.d("listenForMessages()");
    window.addEventListener("message", function(event) {
      var request = event.data;
      if (request.sender === "Esper") {
        Log.d("Received message:", event.data);
        switch (request.type) {

        /* Credentials sent by content script;
           may not be for the desired account. */
        case "CredentialsResponse":
          filterCredentials(request.value);
          break;

        /* Sent by injected script itself, ignored. */
        case "CredentialsRequest":
          break;

        default:
          Log.d("Unknown request type: " + request.type);
        }
      }
    });

  }

  function inspectUrlFragment() {
    var frag = location.hash;
    Log.d("Fragment: ", frag);
    if (/^#esper-/.test(frag)) {
      var data = frag.slice(7);
      if (/^ev-title-/.test(data)) {
        var evTitle = data.slice(9);
        Log.d("Event title: ", evTitle);
        var candidates = $("span.evt-lk");
        var matches =
          candidates.filter(function(index) {
            return $(candidates[index]).text() === evTitle;
          });
        Log.d("Number of matching events: ", matches.length);
        if (matches.length === 1)
          matches.click();
      }
      delete location.hash;
    }
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      Log.d("Init.init()");
      esperRootUrl = $("#esper-script").attr("data-root-url");
      alreadyInitialized = true;
      listenForMessages();
      obtainCredentials();

      inspectUrlFragment();

      // temporary; remove once login stuff is restored
      CalEventView.init();
    }
  }
}
