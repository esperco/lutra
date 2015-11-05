/*
    A big list of all the things to track
*/

module Esper.Analytics {

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
    ClickUserTab,
    ClickUserTabMeetingsDropdown,
    ClickUserTabPreferences,
    CopySelectionToTaskNotes,
    CreateTask,
    CreateTaskTabLinkedEvent,
    EditCalendarPickerEventTitle,
    EditCalendarPickerLocation,
    EditTaskNotes,
    LinkTaskTabEvent,
    LinkTaskTabEmail,
    LinkTaskTabToExistingTask,
    MaximizeSidebar,
    MaximizeSidebarOptions,
    MinimizeSidebar,
    MinimizeSidebarOptions,
    OnboardingModalOpen,         // This happens automatically
    OnboardingLoginSuccess,      // Called after auto-login
    RenameTaskTabTask,
    SaveTaskNotes,
    SelectCalendarPickerExecutiveTimezone,
    SelectCalendarPickerGuestTimezone,
    SelectCalendarPickerMeetingType,
    SelectTaskTabMeetingType,
    SelectTaskTabTaskProgress,
    SelectTaskTabWorkflow,
    UnarchiveTaskTabTask,
    UnlinkTaskTabFromExistingTask
  };

  // Named pages to track
  export enum Page {
    AppLogin = 1,      // app.esper.com login
    Settings,          // app.esper.com/#!/settings
    TeamSettings,      // app.esper.com/#!/team-settings/...
    TeamCalendars,     // app.esper.com/#!/team-settings/.../calendars
    TeamPreferences,   // app.esper.com/#!/team-settings/.../preferences
    TeamWorkflows,     // app.esper.com/#!/team-settings/.../workflows
    TeamLabels,        // app.esper.com/#!/team-settings/.../teamLabels
    TeamTemplates,     // app.esper.com/#!/team-settings/.../templates
    TimeStats          // time.esper.com
  }
}