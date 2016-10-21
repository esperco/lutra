/*
  A place for copy, text formatting, etc.
*/

module Esper.Text {
  // Release Notes
  export const ReleaseNotesAugust2016 =
    <a
      href="https://blog.esper.com/2016/08/05/track-olympics-time-with-hashtags"
      target="_blank">
      Esper now supports hashtags!
      Read more about it here.
    </a>;
  export const August2016Release = 1470009600;
  export const LatestRelease = August2016Release;
  export const ReleaseNotes = ReleaseNotesAugust2016;
  export const DismissNotes = "Click to Dismiss";

  // Payments
  export function getPlanName(planid: ApiT.PlanId) {
    if (planid === "Basic_20161019")
      return "Basic Plan";
    if (planid === "Executive_20161019")
      return "Executive Plan";
    if (planid === "Enterprise_20160923")
      return "Enterprise Plan";
    return "Default Plan";
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
  export const AdvancedDiscountPlanPrice = `$50 / month for first six months`;
  export const StartPlan = "Start Free Trial";
  export const SelectPlan = "Select";
  export const ActivePlan = "Current Plan";

  // Content restrictions
  export function CalendarLimitMsg(limit: number) {
    if (limit === 0) {
      return <a href="/manage#!/team/pay">
        You have not selected a subscription plan yet.
        Please select your plan in the billings page.
        </a>;
    }
    return <a href="/manage#!/team/pay">
      Your current plan only allows {limit}{" "}
      calendar{limit === 1 ? '' : 's'} to be selected.
      Please upgrade your plan in the billings page to select more.
      </a>;
  }

  // Sandbox notice
  export const SandboxNotice =
    <a href="/login">
      This is a demo account.
      Click here to login with a regular account.
    </a>

  // Basics
  export const Label = "tag";
  export const Labels = "tags";
  export const Labeled = "tagged"

  export const Calendar = "calendar";
  export const Calendars = "calendars";

  export const Guest = "person";
  export const Guests = "people";

  export const TeamExec = "account";
  export const TeamExecs = "accounts";

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
