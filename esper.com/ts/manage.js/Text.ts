module Esper.Text {

  // Team info description
  export const GeneralSettings = "General";
  export const NotificationSettings = "Notifications";

  // Add team
  export const AddTeamLink = `New ${TeamExec}`;
  export const AddTeamHeading = "Who are you managing time for?";

  // Remove team
  export const RemoveTeamBtn = "Deactivate";
  export function removeTeamDescription(person?: string) {
    return `Deactivate Esper for ${person || "this " + TeamExec}?`;
  }

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
    "Pick which calendars Esper should use for each person you're supporting.";

  // Notification Settings
  export const GeneralPrefsHeading = "Other Subscriptions";
  export const SendFeedbackEmail = "Email requesting meeting feedback";
  export const SendLabelReminder =
    "Weekly email reminding me to label calendar events";
  export const SendDailyAgenda = "Daily agenda email";
  export const SendFeedbackSummary =
    "Daily meeting feedback summary email";
}
