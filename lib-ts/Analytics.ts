/*
    A big list of all the things to track
*/

module Esper.Analytics {
  // Set this to the writeKey we want to use for the current project
  export var writeKey: string;

  // Events to track
  export enum Trackable {

    ///////////* Login *////////////////////
    AttemptLogin = 1,         // Login was initiated
    SandboxSignup,            // User entered sandbox mode

    ///////////* Time Stats *///////////////

    // Labeling
    ConfirmEventLabels,       // Confirm predicted labels
    EditEventLabels,          // Edit labels for event(s)
    PickLabelProfile,         // Label profiles

    // Post-meeting feedback
    SubmitFeedback,           // Submit feedback from within page


    //////////* Manage + Onboarding */////////////

    // Team Management
    CreateTeam,
    DeactivateTeam,

    SetTimeStatsLabels,       // Set labels for a team
    SetTimeStatsCalendars,    // Set calendars for a team

    // Batch Label Changes
    RenameTimeStatsLabel,     // Rename label on team (and on all events)
    DeleteTimeStatsLabel,     // Delete label from team (and remove from
                              // all events)

    // Preferences changes
    UpdateGeneralPrefs,       // Changes one of the general preferences
    UpdateNotifications       // Changes one of the notification settings
  };

  // Named pages to track
  export enum Page {
    // esper.com/manage
    Manage = 1,            // /#!/
    TeamManage,            // /#!/team/general/...
    TeamLabels,            // /#!/team/labels/...
    TeamCalendars,         // /#!/team/calendars/...
    TeamNotifications,     // /#!/team/notifications/...
    TeamPay,               // /#!/team/pay/...
    TeamExport,            // /#!/team/export/...
    NewTeam,               // /#!/new-team/...
    PersonalSettings,      // /#!/personal
    GroupManage,           // /#!/group/general/...
    GroupLabels,           // /#!/group/labels/...
    GroupNotifications,    // /#!/group/notifications/...
    NewGroup,              // /#!/new-group/...
    CustomerManage,        // /#!/customer/general/...
    CustomerPay,           // /#!/customer/pay/...
    CustomerAccounts,      // /#!/customer/accounts/...
    NewCustomer,           // /#!/new-customer
    Sandbox,               // /#!/sandbox

    // esper.com/now
    Now,                    // /#!/

    // esper.com/time
    TimeStats,             // /#!/
    Report,                // /#!/charts
    TimeStatsCharts,       // /#!/charts/<something>
    CalendarLabeling,      // /#!/calendar-labeling
    CalendarSetup,         // /#!/calendar-setup
    EventFeedback,         // /#!/event
    EventList,             // /#!/list
    LabelSetup,            // /#!/label-setup
    TeamSetup              // /#!/team-setup
  }


  /* Helper functions */

  // Helper to flatten objects into a single level, which works better with
  // Mixpanel than nested objects
  interface IFlatProps {
    [index: string]: number|string|boolean|Date|Array<IFlatProps>;
  };
  export function flatten(obj: {[index: string]: any},
                          prefix?: string, ret?: IFlatProps)
    : IFlatProps
  {
    ret = ret || {};
    prefix = prefix ? prefix + "." : "";
    for (let name in obj) {
      if (obj.hasOwnProperty(name)) {
        if (typeof obj[name] === "object" && !(obj[name] instanceof Array)) {
          ret = flatten(obj[name], prefix + name, ret);
        } else {
          ret[prefix + name] = obj[name];
        }
      }
    }
    return ret;
  }
}
