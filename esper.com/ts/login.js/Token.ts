/*
  Handling of tokens passed in the URL.

  A token is a string that is traded with the server
  for a one-time action or piece of data.
*/

/// <reference path="../lib/Api.ts" />

module Esper.Token {

  // Processes a token, returns a promise that resolves with a message
  export function handle(token: string,
      handleLoginInfo: (response: JQueryPromise<ApiT.LoginResponse>) => void,
      renderLogin: (message?: string, error?: string) => void) {
    return Api.postToken(token)
      .then(function(info: ApiT.TokenInfo) {
        if (! info.token_is_valid) {
          Log.e("Invalid token " + token);
          renderLogin("", "That link is no longer valid.");
        }
        else {
          var x = info.token_value;
          switch (Variant.tag(x)) {
          case "Unsub_daily_agenda":
            renderLogin("You've been unsubscribed from these emails.");
            break;
          case "Unsub_tasks_update":
            renderLogin("You've been unsubscribed from these emails.");
            break;
          case "Unsub_label_reminder":
            renderLogin("You've been unsubscribed from these emails.");
            break;
          case "Login":
            var loginInfo: ApiT.LoginResponse = Variant.value(x);
            handleLoginInfo($.Deferred().resolve(loginInfo));
            break;

          /* Other cases are either obsolete or not supported yet */
          default:
            Log.e("Case not supported: " + Variant.tag(x));
            break;
          }
        }
      }, function() {
        /* Possibly a 404 because the token was already consumed */
        Log.e("HTTP error with token " + token);
        renderLogin("", "That link is no longer valid.");
      });
  }
}
