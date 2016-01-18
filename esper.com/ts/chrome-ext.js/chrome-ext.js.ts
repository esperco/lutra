/*
  This module posts credentials from esper.com's LocalStorage to the Esper
  Chrome extension
*/

/// <reference path="../common/Login.ts" />
/// <reference path="../lib/ApiT.ts" />

module Esper {
  // Pass UID and API secret to the Esper extension
  export function init() {
    var x = Login.getCredentials();
    if (_.isObject(x)
        && _.isString(x.api_secret)
        && _.isString(x.uid)) {
      var esperMessage = {
        sender: "Esper",
        type: "Account",
        value: {
          googleAccountId: x.email,
          credentials: {
            apiSecret: x.api_secret,
            uid: x.uid
          },
          declined: false
        }
      };
      Log.d("esperMessage:", esperMessage);

      // Post only to same domain (this is readable by the Chrome Extension
      // but not by a hostile iFrame)
      var target = window.location.protocol + "//" + window.location.host;
      window.postMessage(esperMessage, target);

      // Delay so there's time for the message to post -- extension should
      // automatically close this window but display a message just in case
      setTimeout(function() {
        $("#esper-main").html(`You are logged in. ` +
          `You may now close this window.`);
      }, 3000);
    }

    else {
      $("#esper-main").html(`There was an error logging you in. ` +
        `Please <a href="/contact">contact us</a> for support.`)
    }
  }
}

Esper.init();
