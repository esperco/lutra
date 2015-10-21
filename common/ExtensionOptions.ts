// Interfaces for Chrome extension options -- these get synced to Chrome
// profile and are not stored on app.esper.com

module Esper.ExtensionOptions {

  /*
    NB: Enum values are stored in Chrome profile so don't change enum order
    unless there's some kind of data migration strategy!
  */

  // How Esper sidebar is displayed in Gmail and Gcal
  export enum SidebarOpts { HIDE, SHOW, NONE };

  // NB: We use enums rather than booleans below in case we want to extend
  // this behavior beyond simple hide/show.

  // Compose control display options
  export enum ComposeControlsOpts { HIDE, SHOW };

  // Appearnace of task notes copy selection button
  export enum CopySelectionOpts { HIDE, SHOW };

  // What our global options object looks like
  export interface Options {
    defaultSidebarState: SidebarOpts;   // Gmail
    calendarSidebarState: SidebarOpts;  // Calendar
    displayComposeControls: ComposeControlsOpts;
    showCopySelection: CopySelectionOpts;
  };

  // Convert options dict to string dict, e.g. for analytics purposes
  export function enumToString(opts: Options): {[index:string]: string} {
    var ret: { [index: string]: string } = {};

    return {
      defaultSidebarState: SidebarOpts[opts.defaultSidebarState],
      calendarSidebarState: SidebarOpts[opts.calendarSidebarState],
      displayComposeControls: ComposeControlsOpts[opts.displayComposeControls],
      showCopySelection: CopySelectionOpts[opts.showCopySelection]
    };
  }
}
