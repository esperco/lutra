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
    ClickComposeBarAskExecIcon = 1,
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
    ClickUserTabPreferences,
    ChangeSidebarTeam,
    CreateTask,
    CreateTaskTabLinkedEvent,
    EditTaskNotes,
    MinimizeSidebar,
    MinimizeSidebarOptions,
    SaveTaskNotes,
    SelectTaskTabMeetingType,
    SelectTaskTabWorkflow,
    MaximizeSidebar,
    MaximizeSidebarOptions,
    LinkTaskTabEvent
  };

  export interface TrackMessage {
    event: Trackable,
    properties: any
  };
}