module Esper.Text {
  // Personal (non-team) settings
  export const PersonalSettings = "Other Settings";

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

  // Remove team
  export const RemoveTeamBtn = "Deactivate";
  export function removeTeamDescription(person?: string) {
    return `Deactivate Esper for ${person || "this " + TeamExec}?`;
  }

  // Payments
  export const PaySettings = "Billing";
  export function getPlanName(planid: ApiT.PlanId) {
    if (planid === "Basic_20160923")
      return "Basic Plan";
    if (planid === "Advanced_20160923")
      return "Executive Plan";
    return "Enterprise Plan";
  }
  export const BasicPlanFeatures = [
    "1 Calendar",
    "2 months of calendar history",
    "Slack integration",
    "#Hashtag event labeling",
    "Weekly label reminder emails"
  ];
  export const FreeTrialMsg = `14 Day Free Trial`;
  export const BasicPlanPrice = `$25 / month`;
  export const AdvancedPlanFeatures = [
    "Unlimited calendars",
    "5 YEARS of calendar history",
    "Slack integration",
    "#Hashtag event labeling",
    "Weekly label reminder emails",
    // "Customizable reports page", // Not supported yet
    "Advanced reporting",
    "Time series reports",
    "Chart export"
  ];
  export const AdvancedPlanPrice = `$100 / month`;
  export const StartPlan = "Start Free Trial";
  export const SelectPlan = "Select";
  export const ActivePlan = "Current Plan";

  // Groups
  export const Group = "group";
  export const Groups = "groups";
  export const GroupDescription =
    `Create a ${_.capitalize(Group)} to combine calendar data for ` +
    `multiple Esper ${TeamExecs} and see how others are spending ` +
    `their time.`

  export const GroupMember = "group member";
  export const GroupMembers = "group members";

  export const GroupIndividual = "individual";
  export const GroupIndividuals = "individuals";

  // Add group
  export const AddGroupLink = `New ${Group}`;
  export const AddGroupHeading = "Create a new group";

  // Group roles
  export const GroupRoleOwner = "Administrator";
  export const GroupRoleOwnerDescription =
    `Can edit group settings and delete group`;
  export const GroupRoleManager = "Manager";
  export const GroupRoleManagerDescription =
    `Can view calendar data for other group members`;
  export const GroupRoleMember = "Contributor";
  export const GroupRoleMemberDescription =
    `Can contribute calendar data to this group`;

   // Group form
  export const GroupCalendarSharing =
    `This ${GroupMember} is sharing their calendars with the group`;
  export const AddGroupIndividualLink = "Invite Someone Else";
  export const RemoveGroupMember = "Remove";
  export const AddGroupTeam = "Share Calendars";
  export const AddGroupTeamDescription =
    `Share this ${TeamExec}'s calendar data with people who have ` +
    `${GroupRoleManager} or ${GroupRoleOwner} access to this ${Group}`
  export const RemoveGroupTeam = "Stop Sharing Calendars";
  export const RemoveGroupTeamDescription =
    `This person will still have access to this group but this person's ` +
    `own calendars will be hidden from the rest of the group.`;
  export function AddGroupMemberHeading(group?: string) {
    return `Which ${TeamExec} would you like to add to ${group || "this " + Group}?`;
  }
  export function ClickToEdit(entity: string) {
    return `Click to edit ${entity}`;
  }

  // Quick-share box
  export const AddSelfToGroupDescription =
    `Do you want to add your ${TeamExec} to this ${Group}? ` +
    `Calendar data will be visible to any person with ` +
    `${GroupRoleManager} or ${GroupRoleOwner} access.`;

  // Remove group
  export const RemoveGroupBtn = "Deactivate";
  export function removeGroupDescription(group?: string) {
    return `Deactivate ${group || "this" + Group}?`;
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
  export const RoleSelf = `Myself`;
  export const RoleExec = `Primary`;

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
    "Which calendars do you want to connect to Esper?"
  export const CalendarSettingsExecDescription =
    "Pick which calendars Esper should use for the person you're supporting.";

  // Notification Settings
  export const GeneralPrefsHeading = "Subscriptions";
  export const BadMeetingPrefsHeading = "Costly Meetings";
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
  export const ShowBadMeetingNotifications =
    "Show Costly Meeting Warnings in Summary Emails";
  export const BadMeetingDuration =
    "Minimum meeting duration to trigger warning (mins)";
  export const BadMeetingPeople =
    "Minimum number of attendees to trigger warning";

  export const FeedbackTiming =
    `When should we send meeting feedback requests?`;
  export const FeedbackTimingStart = `Start of Event`;
  export const FeedbackTimingMiddle = `Middle of Event`;
  export const FeedbackTimingEnd = `End of Event`;

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

  // Customer page
  export const CustomerGeneral = GeneralSettings;
  export const CustomerPay = PaySettings;
  export const CustomerAccounts = `Accounts`;
}
