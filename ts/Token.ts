/*
  Handling of tokens passed in the URL.

  A token is a string that is traded with the server
  for a one-time action or piece of data.
*/

module Esper.Token {
  export function load(token: string) {
    Api.postToken(token)
      .done(function(info: ApiT.TokenInfo) {
        if (! info.token_is_valid) {
          Log.e("Invalid token " + token);
          showMessage("This URL is no longer valid.");
        }
        else {
          var x = info.token_value;
          switch (Variant.tag(x)) {
          case "Unsub_daily_agenda":
            showMessage("You've been unsubscribed from these emails.");
            break;
          case "Unsub_tasks_update":
            showMessage("You've been unsubscribed from these emails.");
            break;

          /* Other cases are either obsolete or not supported yet */
          default:
            Log.e("Case not supported: " + Variant.tag(x));
            Route.nav.home();
          }
        }
      })
      .fail(function() {
        /* Possibly a 404 because the token was already consumed */
        Log.e("HTTP error with token " + token);
        Route.nav.home();
      });
  }

  export function showMessage(msg: string) {
'''
<div #view>
  <p #msgContainer></p>
</div>
'''
    var root = $("#token-page");
    root.children().remove();
    root.append(view);
    document.title = "Esper";

    msgContainer.text(msg);
  }
}
