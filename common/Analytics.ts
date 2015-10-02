/*
  Shared code between extension and injected script analytics
*/
module Esper.Analytics {
  // Events to track
  export enum Trackable {
    ClickAskExecIcon = 1,
    ClickCreateIcon,
    ClickEsperLogoMenu,
    ClickInsertIcon,
    ClickMenuEditSettings,
    ClickMenuExtensionOptions,
    ClickMenuGetAgenda,
    ClickMenuGetHelp,
    ClickMenuGetTaskList,
    ClickSendAgenda,
    ClickSendTaskList,
    ClickSidebarOptionsSettings,
    ClickSidebarPrivacyPolicy,
    ClickSidebarTermsOfUse,
    ClickTaskTab,
    ClickTemplateIcon,
    ClickUserTab,
    ClickUserTabPreferences,
    ChangeTeam,
    CreateLinkedEvent,
    CreateTask,
    EditTaskNotes,
    HideSidebar,
    HideSidebarOptions,
    LinkEvent,
    SaveTaskNotes,
    SelectMeetingType,
    SelectWorkflow,
    ShowSidebar,
    ShowSidebarOptions
  };

  export interface TrackMessage {
    event: Trackable,
    properties: any
  };
}