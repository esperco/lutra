/*
  Translation from standardized codes into messages to be shown to the
  user. This is done for security reasons. See ErrMsg.ts for details.
*/

module Esper.LoginMsg {
  export function get(code: string): string {
    if (!code)
      return null;
    else {
      switch (code) {
      case "slack_auth_success":
        return "Slack authorized. Thank you.";
      default:
        return null;
      }
    }
  }
}
