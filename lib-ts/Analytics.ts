/*
    A big list of all the things to track
*/

module Esper.Analytics {
  // Set this to the writeKey we want to use for the current project
  export var writeKey: string;

  // Events to track
  export enum Trackable {

    /////* Old extension or settings page trackables */////

    ArchiveTaskTabTask = 1,
    CancelTaskTabTask,
    ChangeSidebarTeam,
    ChooseTaskTabEvent,
    ClickCalendarPickerCancel,
    ClickCalendarPickerSave,
    ClickCalendarPickerSaveEventsTo,
    ClickCalendarPickerViewCalendar,
    ClickCancelEmailSearch,
    ClickComposeBarAskExecIcon,
    ClickComposeBarCreateIcon,
    ClickComposeBarInsertIcon,
    ClickComposeBarTemplateIcon,
    ClickFinalizeEventYesDeleteHolds,
    ClickFinalizeEventNoKeepHolds,
    ClickInviteButton,
    ClickInviteCancelButton,
    ClickLabelsTabSave,
    ClickLinkEmailSearch,
    ClickMenuEditSettings,
    ClickMenuEsperLogo,
    ClickMenuExtensionOptions,
    ClickMenuGetAgenda,
    ClickMenuGetHelp,
    ClickMenuGetStarted,
    ClickMenuGetTaskList,
    ClickMenuGetTimeStats,
    ClickModalSendAgenda,
    ClickModalSendTaskList,
    ClickOnboardingDisable,
    ClickOnboardingLogin,    // This refers to the explicit button. The
                             // only reason for the user to click this button
                             // is if the auto-redirect failed.
    ClickOnboardingCreateTeams,
    ClickOnboardingFinish,
    ClickOnboardingYouTube,
    ClickPeopleTab,
    ClickPeopleTabMeetingsDropdown,
    ClickPeopleTabPreferences,
    ClickPreferencesTabAddLocation,
    ClickPreferencesTabAddPhoneNumber,
    ClickPreferencesTabAddUsername,
    ClickPreferencesTabAddWorkplace,
    ClickPreferencesTabInfoModalPrimaryButton,
    ClickReminderButton,
    ClickSlidesBackButton,
    ClickSlidesNextButton,
    ClickSidebarOptionsSettings,
    ClickSidebarPrivacyPolicy,
    ClickSidebarTermsOfUse,
    ClickTaskTab,
    ClickTaskTabDeleteEvent,
    ClickTaskTabEditEvent,
    ClickTaskTabInviteGuests,
    ClickTaskTabUnlinkEvent,
    ClickTemplatesTabTemplate,
    ClickTemplatesTabCreateTemplate,
    ClickTemplatesTabSaveTemplate,
    ClickTimeStatsTweetButton,
    ClickWorkflowsTabCreateWorkflow,
    CopySelectionToTaskNotes,
    CreateTask,
    CreateTaskTabLinkedEvent,
    DisablePreferencesTabDailyAgenda,
    DisablePreferencesTabTasksUpdate,
    EditCalendarPickerEventTitle,
    EditCalendarPickerLocation,
    EditGcalEventLabels,
    EditGmailEventLabels,
    EditTaskNotes,
    EnablePreferencesTabDailyAgenda,
    EnablePreferencesTabTasksUpdate,
    LinkTaskTabEvent,
    LinkTaskTabEmail,
    LinkTaskTabToExistingTask,
    MaximizeSidebar,
    MaximizeSidebarOptions,
    MinimizeSidebar,
    MinimizeSidebarOptions,
    OnboardingModalOpen,         // This happens automatically
    OnboardingLoginSuccess,      // Called after auto-login
    OpenTimeStatsAddCalendarsModal,
    OpenTimeStatsAddLabelsModal,
    OpenTimeStatsGifModal,
    RenameTaskTabTask,
    SaveTaskNotes,
    SelectCalendarPickerExecutiveTimezone,
    SelectCalendarPickerGuestTimezone,
    SelectCalendarPickerMeetingType,
    SelectTaskTabMeetingType,
    SelectTaskTabTaskProgress,
    SelectTaskTabWorkflow,
    UnarchiveTaskTabTask,
    UnlinkTaskTabFromExistingTask,


    ///////////* Time Stats *///////////////

    // Onboarding
    SetTimeStatsLabels,       // Set labels for a team
    SetTimeStatsCalendars,    // Set calendars for a team

    // Batch Label Changes
    RenameTimeStatsLabel,     // Rename label on team (and on all events)
    DeleteTimeStatsLabel,     // Delete label from team (and remove from
                              // all events)

    // Labeling
    EditEventLabels,          // Edit labels for event(s)

    // Post-meeting feedback
    SubmitFeedback            // Submit feedback from within page
  };

  // Named pages to track
  export enum Page {

    // esper.com/settings
    Settings = 1,      // /#!/
    TeamSettings,      // /#!/team-settings/...
    TeamCalendars,     // /#!/team-settings/.../calendars
    TeamPreferences,   // /#!/team-settings/.../preferences
    TeamWorkflows,     // /#!/team-settings/.../workflows
    TeamLabels,        // /#!/team-settings/.../teamLabels
    TeamTemplates,     // /#!/team-settings/.../templates

    // esper.com/time
    TimeStats,             // /#!/
    TimeStatsCharts,       // /#!/charts
    CalendarLabeling,      // /#!/calendar-labeling
    CalendarManage,        // /#!/calendar-manage
    CalendarSetup,         // /#!/calendar-setup
    EventFeedback,         // /#!/event
    EventList,             // /#!/list
    LabelManagement,       // /#!/labels
    LabelSetup,            // /#!/label-setup
    NotificationSettings,  // /#!/notification-settings
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
