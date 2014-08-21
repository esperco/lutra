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
      if (/^https:\/\/mail.google.com\//.test(document.URL))
        pageType = PageType.Gmail;
      else if (/^https:\/\/www.google.com\/calendar\//.test(document.URL))
        pageType = PageType.Gcal;
      else
        pageType = PageType.Other;
    }
    return pageType;
  }

  function sendCredentialsResponse(x: Types.Account) {
    var pageType = getPageType();
    if (pageType === PageType.Gmail || pageType === PageType.Gcal) {
      Log.d("Sending message from content script to page", x);
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
  function sendStorage(x: Types.Storage) {
    if (x !== undefined && x.accounts !== undefined) {
      Log.d("sendStorage()");
      var accounts = x.accounts;
      for (var k in accounts) {
        sendCredentialsResponse(accounts[k]);
      }
    }
  }

  function openLoginTab(googleAccountId) {
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
    <div class="esper-modal-header">
      <div #close class="esper-modal-close-container">
        <img #closeIcon class="esper-modal-close-icon"/>
      </div>
      <div #title class="esper-modal-title"/>
    </div>
    <div #about class="about-esper"/>
    <div #footer class="welcome-footer">
      <a #disableLink class="disable-link">
        Disable Esper for this account
      </a>
      <button #enableButton class="primary-btn enable-btn">
        Enable
      </button>
    </div>
  </div>
</div>
'''

    function closeModal() {
      view.remove();
    }

    title.text("Welcome to Esper");

    enableButton
      .click(function() {
        closeModal();
        openLoginTab(account.googleAccountId);
      });

    disableLink
      .click(function() {
        account.declined = true;
        EsperStorage.saveAccount(account, closeModal);
      });

    background.click(closeModal);
    closeIcon.attr("src", chrome.extension.getURL("img/close.png"));
    close.click(closeModal);

    $("body").append(view);
  }

  function obtainCredentials(googleAccountId, forceLogin) {
    EsperStorage.loadCredentials(
      googleAccountId,
      function(x: Types.Account) {
        if (x.credentials !== undefined
            || (x.declined === true && ! forceLogin)) {
          sendCredentialsResponse(x);
        }
        else {
          openWelcomeModal(x);
        }
    });
  }


  function listenForMessages() {
    Log.d("listenForMessages()");
    window.addEventListener("message", function(event) {
      var request = event.data;
      if (request.sender === "Esper") {

        var ignored = ["CredentialsResponse"];
        var isIgnored = List.mem(request.type, ignored);
        if (! isIgnored)
          Log.d("Received message:", event.data);

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
          if (! isIgnored)
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
