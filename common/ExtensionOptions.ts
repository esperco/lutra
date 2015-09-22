// Interfaces for Chrome extension options -- these get synced to Chrome
// profile and are not stored on app.esper.com

module Esper.ExtensionOptions {

  // NB: We use enums rather than booleans below in case we want to extend
  // this behavior beyond simple hide/show.

  // How Esper sidebar is displayed in Gmail
  export enum SidebarOpts { HIDE, SHOW };

  // Compose control display options
  export enum ComposeControlsOpts { HIDE, SHOW };

  // What our global options object looks like
  export interface Options {
    defaultSidebarState: SidebarOpts;
    displayComposeControls: ComposeControlsOpts;
  };

}
