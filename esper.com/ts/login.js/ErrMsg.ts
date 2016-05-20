/*
  Translation from error codes into error messages to be shown to the
  user.

  We use an error code rather than the error message directly
  because it is passed as a URL parameter.
  This would allow an attacker to display malicious instructions
  on an esper.com page for a user to whom they sent a URL.
*/

module Esper.ErrMsg {
  export function get(code: string): string {
    if (!code)
      return null;
    else {
      switch (code) {
      case "login_again":
        return "For security reasons, please log in again.";
      case "login_error":
        return "There was an error logging you in. Please try again.";
      case "slack_auth_failure":
        return "Slack authentication failed. Please try again.";
      default:
        return "An error has occurred.";
      }
    }
  }
}
