module Esper.ManageMsg {
  export function get(code: string): string {
    if (!code)
      return null;
    else {
      switch (code) {
        case "slack_auth_success":
          return "Slack authentication successful.";
        case "slack_auth_failure":
          return "Slack authentication failed. Please try again.";
        case "preexisting_slack_user":
          return "Disconnected the previous Esper user from this " +
                 "Slack account.";
        default:
          return null;
      }
    }
  }
}
