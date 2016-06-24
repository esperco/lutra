module Esper.Text {

  // Personal (non-team) settings
  export const PersonalSettings = "Personal";

  // Deactivate account?
  export const DeactivateDescription = `Deactivating your account ` +
    `will revoke Esper's access to your calendar service. If you are ` +
    `managing time for another person and that person has not logged ` +
    `into Esper to claim the account, that person's account will ` +
    `also be deactivated.`;
  export function deactivatePrompt(email: string) {
    return `Deactivate ${email}?`;
  }
  export const DeactivateBtn = "Deactivate";

  // Team info description
  export const GeneralSettings = "General";
  export const NotificationSettings = "Notifications";

  // Add team
  export const AddTeamLink = `New ${TeamExec}`;
  export const AddTeamHeading = "Who are you managing time for?";

  // Add group
  export const AddGroupLink = `New ${Group}`;
  export const AddGroupHeading = "Create a new group";

  // Remove team
  export const RemoveTeamBtn = "Deactivate";
  export function removeTeamDescription(person?: string) {
    return `Deactivate Esper for ${person || "this " + TeamExec}?`;
  }

  // Remove group
  export const RemoveGroupBtn = "Remove";
  export function removeGroupDescription(group?: string) {
    return `Remove ${group || "this" + Group}?`;
  }

  // Sharing
  export const ExecAssistantsDescription = `These people have permission to ` +
    `manage time for this ${TeamExec}`;
  export const SelfAssistantsDescription = `These people have permission to ` +
    `manage your time`;
  export const ExecInviteAssistant = `Invite someone to help manage time ` +
    `for this ${TeamExec}`;
  export const SelfInviteAssistant = `Invite someone to help manage your time`;
  export const InviteAssistantSuccess = `Invitation sent!`;
  export const RemoveAssistant = `Remove access for this person`;

  // Label actions
  export const LabelRenameDescription =
    `Rename a ${Label.toLowerCase()} across all events.`;
  export const LabelArchiveDescription =
    `Archive a ${Label.toLowerCase()} to ` +
    `remove it from this list but keep displaying it in charts.`;
  export const LabelDeleteDescription =
    `Delete a ${Label.toLowerCase()} to ` +
    `permanently remove it from all charts and events.`

  // Calendaring
  export const CalendarSettingsSelfDescription =
    "Which calendars do you want connect to Esper?"
  export const CalendarSettingsExecDescription =
    "Pick which calendars Esper should use for the person you're supporting.";

  // Notification Settings
  export const GeneralPrefsHeading = "Subscriptions";
  export function generalPrefsDescription(email: string) {
    return <span>
      These notifications will go to {" "}<strong>{email}</strong>.
    </span>;
  }
  export const SendFeedbackEmail = "Emails requesting meeting feedback";
  export const SendFeedbackSlack = "Slack messages requesting meeting feedback";
  export const SendLabelReminder =
    "Weekly email reminding me to label calendar events";
  export const SendDailyAgenda = "Daily agenda email";
  export const SendFeedbackSummary =
    "Daily meeting feedback summary email";
  export const SendDailyBreakdownEmail =
    "Daily Calendar Summary Email";
  export const SendWeeklyBreakdownEmail =
    "Weekly Calendar Summary Email";

  export const FeedbackHeading = 'Meeting Feedback Notifications';
  export function feedbackDescription(email: string) {
    return <span>
      These notifications will go to {" "}<strong>{email}</strong>.
    </span>;
  }
  export function execOnlyFeedbackDescription(exec?: string) {
    return <span>
      Meeting feedback notifications are sent directly to the person
      whose time you're tracking. You must be logged in as
      {" "}{exec ? <strong>{exec}</strong> : "that person"}{" "}
      to enable meeting feedback notifications.
    </span>;
  }

  export const SlackAuthError = `We were unable to connect to Slack. ` +
    `Click here to try reconnecting.`;
}
