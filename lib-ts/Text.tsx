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

  // Hints
  export const FilterActionHintText = <div>
    <p>
      This is the Advanced Filtering feature available only to
      Executive plan users or Enterprise plan users.
    </p>
    <p>
      Click here to display a menu containing options that you can
      adjust to more accurately display how you spend your time.
    </p>
  </div>;
  export const PeriodSelectorHintText =
    "Click here to browse through your calendar history.";
  export const SeeMoreHintText =
    "Click here to see more details about how you spend your time.";

  // Misc help
  export const EsperLinkDescription =
    "Enable the Esper link on your calendar. Esper places a unique link on " +
    "each event description so you can review your tags and notes. This " +
    "link is private to you or your organization, so you're informed before " +
    "or after your meetings!";

  // Payments
  export const BasicPlan: Types.PlanDetails = {
    id: "Basic_20161019",
    name: "Basic Plan",
    freeTrial: "14 Day Free Trial",
    extendedTrial: "One Month Free Trial",
    price: "$25 / month",
    features: [
      "1 Calendar",
      "2 months of calendar history",
      "Slack integration",
      "#Hashtag event labeling",
      "Weekly label reminder emails"
    ]
  };

  export const ExecPlan: Types.PlanDetails = {
    id: "Executive_20161019",
    name: "Executive Plan",
    freeTrial: BasicPlan.freeTrial,
    extendedTrial: BasicPlan.extendedTrial,
    price: "$100 / month",
    discountedPrice: "$50 / month for first 6 months",
    features: [
      "Unlimited calendars",
      "5 YEARS of calendar history",
      "Slack integration",
      "#Hashtag event labeling",
      "Weekly label reminder emails",
      // "Customizable reports page", // Not supported yet
      "Advanced reporting",
      "Time series reports",
      "Chart downloading",
      "CSV exports"
    ]
  };

  export const EnterprisePlan: Types.PlanDetails = {
    id: "Enterprise_20160923",
    name: "Enterprise Plan",
    price: <span>
      $20 / user / month<br />
      10 users minimum
    </span>,
    enterprise: true,
    features: [
      "Unlimited calendars",
      "5 YEARS of calendar history",
      "Slack integration",
      "#Hashtag event labeling",
      "Weekly label reminder emails",
      // "Customizable reports page", // Not supported yet
      "Advanced reporting",
      "Time series reports",
      "Chart downloading",
      "CSV exports",
      "Coordinate time for multiple users",
      "Find time-consuming meetings"
    ]
  };

  export const AllPlans = [
    BasicPlan,
    ExecPlan,
    EnterprisePlan
  ];

  export function getPlanName(planid: ApiT.PlanId) {
    let plan = _.find(AllPlans, (p) => p.id === planid);
    return plan ? plan.name : "Default Plan";
  }
  export const StartFreeTrial = "Start Free Trial";
  export const SelectPlan = "Select Plan";
  export const ActivePlan = "Keep Current Plan";

  export const ExtendedTrialHeading = "You're getting a free month of Esper";
  export const ExtendedTrialDescription = "Select an option below to " +
    "start your free trial.";

  export const AddToEnterpriseLink =
    "Does your company already have an Enterprise Plan? " +
    "Click here to request that they add you."
  export const AddToEnterpriseHeading = `Enterprise Plan`;
  export const AddToEnterpriseDescription = <div className="description">
    To link this account to an Enterprise Plan, provide
    the email address of your billing contact below.
    <br />
    Alternatively, you may contact Andrew directly at {" "}
    <a href="mailto:andrew@esper.com">andrew@esper.com</a>.
  </div>;
  export const AddToExistingEnterpriseDescription =
    `You can also add this account to your existing plan.`;
  export const OnlyOneEnterpriseCustomer = `Existing Enterprise Plan`;
  export function AddToEnterprise(name: string) {
    return `Add to ${name}`;
  }

  export const BillingContactLabel = "Billing Contact";
  export const BillingContactSuccess =
    `We've asked your billing contact to approve this account.`;

  export const EnterpriseMsg =
    "This account is managed as an Enterprise Account.";
  export const GoToEnterpriseBilling =
    "Click here to go to Enterprise Billing.";

  export const CustomerNoPermission = <span>
    Billing for this account is managed by someone else. If you
    need assistance, you can <a href="/contact">contact us here</a>.
  </span>;

  export const ThisCustomer = "This organization";
  export function SubscribedToPlan(subject: string, plan: ApiT.PlanId) {
    return `${subject} is subscribed to the ` +
      getPlanName(plan);
  }

  export const SelectPlanHeader ="Select a Plan";
  export const SubscriptionExpired = "Your subscription has expired.";
  export const SubscriptionCanceled = "Your subscription has been canceled.";
  export const NoPlan = "You are not subscribed to any plan.";
  export const SelectToRenew = "Please select a plan below to continue.";
  export const UpdateCreditCard = "Please provide a credit card to continue.";
  export const EnsureCreditCard = "Please ensure that you have added at least "
                                + "one non-expired credit card to continue.";
  export const AddCard = "Add Credit Card";

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
  export const CalendarPeriodUpgradeMsg =
    "Upgrade now to browse further back in history.";
  export const PlanUpgradeText =
    "The feature that you were trying to access is not enabled with your " +
    "current plan. Upgrade your plan now to enable more time-saving features!";

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

  // Team Selector
  export const NoTeam = `Select ${TeamExec}`;
  export const ManageTeams = `Manage ${TeamExecs}`;

  // Calendar List
  export const NoCalendarError =
    "Please wait until calendars are available.";
  export const MustSelectCalendar =
    "Please select at least one calendar";
  export const EsperEventLink =
    "Add an Esper link to my calendar event descriptions";

  // Event Editor
  export const FeedbackTitle  = "Meeting Feedback"
  export const NoAttend     = "Unhide";
  export const YesAttend    = "Hide"
  export const NoAttendLong = "This event is not included in charts. " +
    "Click to unhide this event.";
  export const YesAttendLong = "Click to hide this event from charts."
  export const NoEventTitle = `Untitled Event`;
  export const ManageLabels = `Manage ${_.capitalize(Labels)}`;

  export const DefaultErrorTooltip = `There was an error connecting to the ` +
    `server. Try refreshing or contacting us at https://esper.com/contact`;

  // User already exists (used in /manage and /time onboarding)
  export const ExecHasTeamErr = <span>
    This person already has an account. Please ask that user to log in and
    share the account with you on the Settings page. If you have
    any questions, please contact us at <a href="http://esper.com/contact">
      esper.com/contact.
    </a>
  </span>;

}
