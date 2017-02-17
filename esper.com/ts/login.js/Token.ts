/*
  Handling of tokens passed in the URL.

  A token is a string that is traded with the server
  for a one-time action or piece of data.

  2 API calls are available:
  - GET: for inspecting the token without consuming it
  - POST: for consuming the token
*/

/// <reference path="../lib/Api.ts" />

module Esper.Token {

  // Inspect the token. This allows us to prompt the user for confirmation
  // before performing the action granted by the token.
  export function inspect(token: string) {
    return Api.getToken(token)
      .then(function(x: ApiT.TokenInfo) {
      });
  }

  // Processes a token, returns a promise that resolves with a message
  export function consume(token: string,
      handleLoginInfo: (response: JQueryPromise<ApiT.LoginResponse>) => void,
      renderLogin: (message?: string, error?: string) => void) {
    return Api.postToken(token)
      .then(function(info: ApiT.TokenResponse) {
        var x = info.token_value;
        switch (Variant.tag(x)) {
        case "Invite_join_group":
          // TODO: redirect user to group management page where they
          //       can add their teams to their groups or leave the group.
          break;

        /*
          NB: This case should not happen with new backend code. We should
          get an ?invite=token link rather than ?token=token link, which means
          the token would be passed to server via login rather than consumed
          here. But leave this in for the time being as fallback.
        */
        case "Invite_join_team":
          renderLogin("Invite accepted. Please login to continue.");
          break;

        case "Login":
          var loginInfo: ApiT.LoginResponse = Variant.value(x);
          handleLoginInfo($.Deferred().resolve(loginInfo));
          break;
        case "Confirm_timebomb_event":
          renderLogin("Meeting confirmed.");
          break;
        case "Unsub_daily_agenda":
          renderLogin("You've been unsubscribed from these emails.");
          break;
        case "Unsub_tasks_update":
          renderLogin("You've been unsubscribed from these emails.");
          break;
        case "Unsub_label_reminder":
          renderLogin("You've been unsubscribed from these emails.");
          break;
        case "Unsub_feedback_summary":
          renderLogin("You've been unsubscribed from these emails.");
          break;
        case "Unsub_group_email":
          renderLogin("You've been unsubscribed from these emails.");
          break;
        case "Unsub_ask_feedback":
          renderLogin("You've been unsubscribed from these emails.");
          break;

        /* Other cases are either obsolete or not supported yet */
        default:
          Log.e("Case not supported: " + Variant.tag(x));
          break;
        }
      }, function() {
        /* Possibly a 404 because the token was already consumed */
        renderLogin("", "That link is no longer valid.");
      });
  }
}
