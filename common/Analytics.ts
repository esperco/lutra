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
    ClickSidebarOptionsSettings,
    ClickSidebarPrivacyPolicy,
    ClickSidebarTermsOfUse,
    ClickTaskTab,
    ClickUserTab,
    ClickUserTabMeetingsDropdown,
    ClickUserTabPreferences,
    ChangeSidebarTeam,
    ChooseTaskTabEvent,
    CreateTask,
    CreateTaskTabLinkedEvent,
    EditTaskNotes,
    LinkTaskTabEvent,
    LinkTaskTabToExistingTask,
    MaximizeSidebar,
    MaximizeSidebarOptions,
    MinimizeSidebar,
    MinimizeSidebarOptions,
    RenameTaskTabTask,
    SaveTaskNotes,
    SelectTaskTabMeetingType,
    SelectTaskTabWorkflow,
    UnarchiveTaskTabTask
  };

  export interface TrackMessage {
    event: Trackable,
    properties: any
  };
}