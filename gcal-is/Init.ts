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
    var googleAccountId = Gcal.getUserEmail();
    if (googleAccountId === undefined)
      Log.e("Cannot extract Google account ID (email address)");
    else {
      Log.d("Google account ID: " + googleAccountId);
      var esperMessage : Message.Message = {
        sender: "Esper",
        type: "CredentialsRequest",
        value: googleAccountId
      };
      window.postMessage(esperMessage, "*");
    }
  }

  function injectEsperControls() {
    Login.printStatus();
    if (Login.loggedIn()) {
      Api.getLoginInfo()
        .done(function(loginInfo) {
          Login.info = loginInfo;
          CalEventView.init();
        });
    }
  }

  /*
    Check if the credentials we received from the content script
    match the current gmail user.
  */
  function filterCredentials(account: Types.Account) {
    Log.d("filterCredentials():", account);
    var googleAccountId = Gcal.getUserEmail();
    if (account !== undefined && account.googleAccountId === googleAccountId) {
      Login.setAccount(account);
      injectEsperControls();
    }
  }

  function listenForMessages() {
    Log.d("listenForMessages()");
    window.addEventListener("message", function(event) {
      var request: Message.Message = event.data;
      if (request.sender === "Esper") {

        var ignored = [
          "CredentialsRequest",
          "Logout",
          "ActiveEvents"
        ];
        var isIgnored = List.mem(ignored, request.type);
        if (! isIgnored)
          Log.d("Received message:", event.data);

        switch (request.type) {

        /* Credentials sent by content script;
           may not be for the desired account. */
        case "CredentialsResponse":
          filterCredentials(request.value);
          break;

        /* Sent by injected script itself, ignored. */
        case "CredentialsRequest":
        case "Logout":
        case "ActiveEvents":
          break;

        default:
          if (! isIgnored)
            Log.d("Unknown request type: " + request.type);
        }
      }
    });

  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      Log.d("Init.init()");
      esperRootUrl = $("#esper-script").attr("data-root-url");
      alreadyInitialized = true;
      listenForMessages();
      obtainCredentials();
    }
  }
}
