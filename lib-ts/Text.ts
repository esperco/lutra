/*
  A place for copy, text formatting, etc.
*/

module Esper.Text {
  // Basics
  export const Label = "goal";
  export const Labels = "goals";

  export const Calendar = "calendar";
  export const Calendars = "calendars";

  export const Guest = "person";
  export const Guests = "people";

  export const TeamExec = "account";
  export const TeamExecs = "accounts";

  export const Group = "group";
  export const Groups = "groups";

  export const GroupMember = "group member";
  export const GroupMembers = "group members";

  export const GroupIndividual = "individual";
  export const GroupIndividuals = "individuals";

  // Group form
  export const GroupCalendarSharing =
    `This ${GroupMember} is sharing their calendars with the group`;
  export const AddGroupIndividualLink = "Invite Someone Else";
  export function AddGroupMemberHeading(group?: string) {
    return `Which ${TeamExec} would you like to add to ${group || "this " + Group}?`;
  }
  export function ClickToEdit(entity: string) {
    return `Click to edit ${entity}`;
  }

  // Group roles
  export const GroupRoleOwner = "Owner";
  export const GroupRoleManager = "Manager";
  export const GroupRoleMember = "Member";

  // Default Loading Message
  export const DefaultLoadingMsg = "Loading";

  // Label interface
  export const AddLabel = "add " + Label;
  export const FindLabels = "find " + Labels;
  export const FindAddLabels = "find / add " + Labels;
  export function predictionTooltip(score: number) { // Score is 0-1
    return `We are ${Util.roundStr(score * 100, 0)}% confident that this ` +
           `${Label.toLowerCase()} is applicable to this event`;
  }
  export const NewLabel = "New " + _.capitalize(Label);
  export const EditLabels = "Edit " + _.capitalize(Labels);
  export const ConfirmLabels = "Confirm " + _.capitalize(Labels);
  export const LabelRequired = `Please add at least one ${Label}.`;

  export const LabelProfileDescription = `Use one of our suggested ${Label} ` +
    `sets or add your own custom ${Labels}.`
  export const LabelProfileBackBtn = "Try another preset."

  // Calendar List
  export const NoCalendarError =
    "Please wait until calendars are available.";
  export const MustSelectCalendar =
    "Please select at least one calendar";

  // Event Editor
  export const FeedbackTitle  = "Meeting Feedback"
  export const NoAttend     = "Ignored";
  export const YesAttend    = "Ignore?"
  export const NoEventTitle = `Untitled Event`;
  export const ManageLabels = `Manage ${_.capitalize(Labels)}`;

  export const DefaultErrorTooltip = `There was an error connecting to the ` +
    `server. Try refreshing or contacting us at https://esper.com/contact`;
}
