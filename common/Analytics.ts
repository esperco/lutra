/*
  Shared code between extension and injected script analytics
*/
module Esper.Analytics {
  // Events to track
  export enum Trackable {
    // Most trackable events have the form
    // (Verb)(Module)(Icon/HTMLElement)
    // Anything that deviates from the above form should
    // always be immediately obvious as to where the event
    // is fired from, e.g. SaveTaskNotes - there is only one
    // place where you can save your task notes
    ArchiveTaskTabTask = 1,
    CancelTaskTabTask,
    ClickCalendarPickerCancel,
    ClickCalendarPickerSave,
    ClickCalendarPickerSaveEventsTo,
    ClickCalendarPickerViewCalendar,
    ClickComposeBarAskExecIcon,
    ClickComposeBarCreateIcon,
    ClickComposeBarInsertIcon,
    ClickComposeBarTemplateIcon,
    ClickMenuEditSettings,
    ClickMenuEsperLogo,
    ClickMenuExtensionOptions,
    ClickMenuGetAgenda,
    ClickMenuGetHelp,
    ClickMenuGetTaskList,
    ClickModalSendAgenda,
    ClickModalSendTaskList,
    ClickReminderButton,
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
    ChangeSidebarTeam,
    ChooseTaskTabEvent,
    CreateTask,
    CreateTaskTabLinkedEvent,
    EditCalendarPickerEventTitle,
    EditCalendarPickerLocation,
    EditTaskNotes,
    LinkTaskTabEvent,
    LinkTaskTabToExistingTask,
    MaximizeSidebar,
    MaximizeSidebarOptions,
    MinimizeSidebar,
    MinimizeSidebarOptions,
    RenameTaskTabTask,
    SaveTaskNotes,
    SelectCalendarPickerExecutiveTimezone,
    SelectCalendarPickerGuestTimezone,
    SelectCalendarPickerMeetingType,
    SelectTaskTabMeetingType,
    SelectTaskTabTaskProgress,
    SelectTaskTabWorkflow,
    UnarchiveTaskTabTask
  };

  export interface TrackMessage {
    event: Trackable,
    properties: any
  };
}