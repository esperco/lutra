/// <reference path="../common/Analytics.ts" />
/// <reference path="../common/Login.ts" />

module Esper.Auth {
  /*
    The user's API secret is stored using chrome.storage.local.

    The user logs in once with Esper, then the API secret is
    propagated across all Chrome browsers where the user is logged-in
    as a Google Chrome user.
  */

  enum PageType {
    Gmail,
    Gcal,
    Other
  }

  var pageType: PageType;

  function getPageType() {
    if (pageType === undefined) {
      if (/^https:\/\/mail.google.com\//.test(document.URL)) {
        pageType = PageType.Gmail;
      } else if (/^https:\/\/www.google.com\/calendar\//.test(document.URL)) {
        pageType = PageType.Gcal;
      } else {
        pageType = PageType.Other;
      }
    }
    return pageType;
  }

  function sendCredentialsResponse(x: Types.Account) {
    var pageType = getPageType();
    if (pageType === PageType.Gmail || pageType === PageType.Gcal) {
      Log.d("Sending message from content script to page", x);
      var esperMessage : Message.Message = {
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
  function sendStorage(x: Types.Storage) {
    if (x !== undefined && x.accounts !== undefined) {
      Log.d("sendStorage()");
      var accounts = x.accounts;
      for (var k in accounts) {
        sendCredentialsResponse(accounts[k]);
      }
    }
  }

  // Store id of last account we tried logging in for (so we know whether
  // we should focus on this tab on login)
  var loginInProgressFor: string;

  function openLoginTab(googleAccountId) {
    loginInProgressFor = googleAccountId;
    var url = Conf.Api.url + "/#!login/" + encodeURIComponent(googleAccountId);
    Log.d("Going off to " + url);
    var win = window.open(url, '_blank');
    win.focus();
  }

  function openWelcomeModal(account: Types.Account) {
'''
<div #view>
  <div #background class="esper-modal-bg"/>
  <div #modal class="esper-modal esper-welcome-modal">
    <div class="esper-modal-header">Welcome to Esper</div>
    <div #about class="esper-about">
      <div #aboutText class="esper-about-text"/>
      <img #sidebarScreenshot class="esper-sidebar-screenshot"/>
    </div>
    <div class="esper-modal-footer esper-clearfix">
      <button #enable class="esper-btn esper-btn-primary modal-primary">
        Enable
      </button>
      <button #cancel class="esper-btn esper-btn-secondary modal-cancel">
        Cancel
      </button>
      <button #disable class="esper-btn esper-btn-secondary modal-delete">
        Disable for this account
      </button>
    </div>
  </div>
</div>
'''
    aboutText.text("Enable this extension to track tasks, link emails with " +
      "calendar events, and access your executive's preferences.");

    sidebarScreenshot
      .attr("src", $("#esper-script").attr("data-root-url")+"img/sidebar.png");

    function closeModal() { view.remove(); }

    background.click(closeModal);

    enable.click(function() {
      closeModal();
      openLoginTab(account.googleAccountId);
    });

    cancel.click(closeModal);

    disable.click(function() {
      account.declined = true;
      EsperStorage.saveAccount(account, closeModal);
    });

    $("body").append(view);
  }

  function obtainCredentials(googleAccountId, forceLogin) {
    EsperStorage.loadCredentials(
      googleAccountId,
      function(x: Types.Account) {
        if (!x.declined || forceLogin) {
          if (x.credentials !== undefined) {
            Login.setAccount(x);
            Analytics.identify();
            sendCredentialsResponse(x);
          }
          else {
            openWelcomeModal(x);
          }
        }
    });
  }


  function listenForMessages() {
    Log.d("listenForMessages()");
    window.addEventListener("message", function(event) {
      var request: Message.Message = event.data;
      if (request.sender === "Esper") {

        var ignored = ["CredentialsResponse"];
        var isIgnored = List.mem(ignored, request.type);
        if (! isIgnored) {
          Log.d("Received message:", event.data);
        }

        switch (request.type) {

        /* Listen for Esper credentials posted by an app.esper.com page. */
        case "Account":
          EsperStorage.saveAccount(
            request.value,
            function() { Log.d("Received and stored account data"); }
          );
          break;

        /* Receive an updated list of recently accessed calendar events */
        case "ActiveEvents":
          EsperStorage.saveActiveEvents(
            request.value,
            function() { Log.d("Received and stored active events"); }
          );
          break;

        /* Receive an updated list of recently accessed email threads */
        case "ActiveThreads":
          EsperStorage.saveActiveThreads(
            request.value,
            function() { Log.d("Received and stored active threads"); }
          );
          break;

        /* Listen for request from the injected script at mail.google.com */
        case "CredentialsRequest":
          obtainCredentials(request.value, false);
          break;

        /* Same as CredentialsRequest, but try to log in no matter what. */
        case "LoginRequest":
          obtainCredentials(request.value, true);
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
            Log.d("Cleared all sync storage created by the Esper extension.");
          });
          break;

        default:
          if (! isIgnored) {
            Log.d("Unknown request type: " + request.type);
          }
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
      Log.d("Detected change in local storage.");
      if (newStorage !== undefined && newStorage.accounts !== undefined) {
        /* Send credentials for all known accounts */
        sendStorage(newStorage);

        /* Send empty account for all newly logged-out accounts */
        if (oldStorage !== undefined && oldStorage.accounts !== undefined) {
          for (var k in oldStorage.accounts) {
            var account = newStorage.accounts[k];
            if (account === undefined) {
              sendCredentialsResponse({
                googleAccountId: k,
                declined: false
              });
            }
          }
        }

        /* Post message to Event Script asking it to focus on current tab if
           if login data is provided for whatever login is in progress */
        for (var k in newStorage.accounts) {
          if (loginInProgressFor === k) {
            Login.setAccount(newStorage.accounts[k]);
            Message.postToExtension(Message.Type.FocusOnSender);
            break;
          }
        }

        // Always unset loginInProgress variable so future logins in other
        // tabs don't accidentally refocus on this one
        loginInProgressFor = ""; // Unset
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
