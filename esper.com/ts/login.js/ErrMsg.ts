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
      case "slack_auth_failure":
        return "Slack not authorized.";
      default:
        return "An error has occurred.";
      }
    }
  }
}
