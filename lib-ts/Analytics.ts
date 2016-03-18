/*
    A big list of all the things to track
*/

module Esper.Analytics {
  // Set this to the writeKey we want to use for the current project
  export var writeKey: string;

  // Events to track
  export enum Trackable {
    // Most trackable events have the form
    // (Verb)(Module)(Icon/HTMLElement)
    // Anything that deviates from the above form should
    // always be immediately obvious as to where the event
    // is fired from, e.g. ClickSaveTaskNotes - there is only one
    // place where you can save your task notes

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
    DeleteTimeStatsLabel,
    DisablePreferencesTabDailyAgenda,
    DisablePreferencesTabTasksUpdate,
    EditCalendarPickerEventTitle,
    EditCalendarPickerLocation,
    EditGcalEventLabels,
    EditGmailEventLabels,
    EditTimeEsperEventLabels,
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
    RenameTimeStatsLabel,
    SaveTaskNotes,
    SelectCalendarPickerExecutiveTimezone,
    SelectCalendarPickerGuestTimezone,
    SelectCalendarPickerMeetingType,
    SelectTaskTabMeetingType,
    SelectTaskTabTaskProgress,
    SelectTaskTabWorkflow,
    SetTimeStatsCalendars,
    SetTimeStatsLabels,
    UnarchiveTaskTabTask,
    UnlinkTaskTabFromExistingTask,
    ViewTimeStats                // Viewed a particular set of time stats
                                 // for at least 3 seconds
  };

  // Named pages to track
  export enum Page {
    Settings = 1,      // esper.com/settings
    TeamSettings,      // esper.com/settings/#!/team-settings/...
    TeamCalendars,     // esper.com/settings/#!/team-settings/.../calendars
    TeamPreferences,   // esper.com/settings/#!/team-settings/.../preferences
    TeamWorkflows,     // esper.com/settings/#!/team-settings/.../workflows
    TeamLabels,        // esper.com/settings/#!/team-settings/.../teamLabels
    TeamTemplates,     // esper.com/settings/#!/team-settings/.../templates
    TimeStats,         // esper.com/time
    TimeStatsCharts,   // esper.com/time/#!/charts
    CalendarLabeling,  // esper.com/time/#!/calendar-labeling
    CalendarSetup,     // esper.com/time/#!/calendar-setup
    EventFeedback,     // esper.com/time/#!/event
    EventList,         // esper.com/time/#!/list
    LabelManagement,   // esper.com/time/#!/labels
    NotificationSettings,  // esper.com/time/#!/notification-settings
    DirectoryHome      // dir.esper.com
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
