module Esper.Init {
  export var esperRootUrl : string;
    /* URL prefix to access files provided by the extension.
       Sample usage:
         object.attr("data", Init.esperRootUrl + "img/icon.svg");
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
  export function obtainCredentials(forceLogin: boolean = false) {
    var googleAccountId = GmailJs.get.user_email();
    Log.d("Google account ID: " + googleAccountId);
    var type = forceLogin === true ? "LoginRequest" : "CredentialsRequest";
    var esperMessage : Message.Message = {
      sender: "Esper",
      type: type,
      value: googleAccountId
    };
    window.postMessage(esperMessage, "*");
  }

  export function login() {
    obtainCredentials(true);
  };

  function injectEsperControls() {
    Login.printStatus();
    Menu.init();
    if (Login.loggedIn()) {
      /* menu is then created in reaction to this */
      Login.getLoginInfo()
        .done(function(loginInfo) {
          Sidebar.init().done(function() {
            ComposeToolbar.init();
          });
        });
    } else {
      Menu.create();
    }
  }

  /*
    Watch for login changes and reinject the Esper controls
   */
  Login.watchableAccount.watch(function(newAccount, newValidity,
                                        oldAccount, oldValidity) {
    if (newValidity === true) {
      injectEsperControls();
    }
    else {
      /* Redraw main menu (remove "log out" option, add "log in" option) */
      Menu.create();
    }
  });

  /*
    Check if the credentials we received from the content script
    match the current gmail user.
  */
  function filterCredentials(account: Types.Account) {
    var googleAccountId = GmailJs.get.user_email();
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
          "LoginRequest",
          "Logout",
          "ActiveThreads"
        ];
        var isIgnored = List.mem(ignored, request.type);
        if (! isIgnored) {
          Log.d("Received message:", event.data);
        }

        switch (request.type) {

        /* Credentials sent by content script;
           may not be for the desired account. */
        case "CredentialsResponse":
          filterCredentials(request.value);
          break;

        default:
          if (! isIgnored) {
            Log.e("Unknown request type: " + request.type);
          }
        }
      }
    });

  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      Log.d("Init.init()");
      Gmail.init();
      CurrentThread.preInit();
      esperRootUrl = $("#esper-script").attr("data-root-url");
      ComposeControls.init();
      alreadyInitialized = true;
      TaskTab.init();
      listenForMessages();
      obtainCredentials();
      Inactivity.init();
      ObserveMessage.init();
      ExtensionOptions.init();
      ThreadState.init();
      Timezone.init();
    }
  }
}
