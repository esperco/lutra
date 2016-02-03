/*
  Handling of tokens passed in the URL.

  A token is a string that is traded with the server
  for a one-time action or piece of data.
*/

/// <reference path="../lib/Api.ts" />

module Esper.Token {

  // Processes a token, returns a promise that resolves with a message
  export function handle(token: string) {
    return Api.postToken(token)
      .then(function(info: ApiT.TokenInfo) {
        if (! info.token_is_valid) {
          Log.e("Invalid token " + token);
          return "That link is no longer valid.";
        }
        else {
          var x = info.token_value;
          switch (Variant.tag(x)) {
          case "Unsub_daily_agenda":
            return "You've been unsubscribed from these emails.";
          case "Unsub_tasks_update":
            return "You've been unsubscribed from these emails.";
          case "Unsub_label_reminder":
            return "You've been unsubscribed from these emails.";

          /* Other cases are either obsolete or not supported yet */
          default:
            Log.e("Case not supported: " + Variant.tag(x));
            break;
          }
        }
      }, function() {
        /* Possibly a 404 because the token was already consumed */
        Log.e("HTTP error with token " + token);
        return "That link is no longer valid.";
      });
  }
}
