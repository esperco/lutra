/// <reference path="../common/Analytics.ts" />
/// <reference path="../common/Login.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../common/Login.ts" />
/// <reference path="./Onboarding.tsx" />

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
      if (HostUrl.isGmail(document.URL)) {
        pageType = PageType.Gmail;
      } else if (HostUrl.isGcal(document.URL)) {
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

  export function openLoginTab(googleAccountId) {
    loginInProgressFor = googleAccountId;
    var url = Conf.Api.url + "/#!login/" + encodeURIComponent(googleAccountId);
    Log.d("Going off to " + url);
    var win = window.open(url, '_blank');
    win.focus();
  }

  export function openWelcomeModal(account: Types.Account) {
    var div = $('<div>').appendTo('body');
    div.renderReact(Onboarding.OnboardingModal, account);
  }

  function obtainCredentials(googleAccountId, forceLogin) {
    EsperStorage.loadCredentials(
      googleAccountId,
      function(x: Types.Account) {
        if (!x.declined || forceLogin) {
          if (x.credentials !== undefined) {
            Login.setAccount(x);
            Login.getLoginInfo().always(Analytics.identify);
            sendCredentialsResponse(x);
          }
          else {
            openWelcomeModal(x);
          }
        }
    });
  }

  // Exported helper function to open welcome modal for dev
  export function devWelcomeModal(googleAccountId: string) {
    EsperStorage.loadCredentials(
      googleAccountId,
      function(x: Types.Account) {
          if (x.credentials !== undefined) {
            Login.setAccount(x);
            Login.getLoginInfo().always(Analytics.identify);
            sendCredentialsResponse(x);
          }
          openWelcomeModal(x);
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
          window.location.reload();
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
            Onboarding.handleLogin();
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
