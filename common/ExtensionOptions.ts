// Interfaces for Chrome extension options -- these get synced to Chrome
// profile and are not stored on app.esper.com

module Esper.ExtensionOptions {

  // How Esper sidebar is displayed in Gmail
  export enum SidebarOpts { HIDE, SHOW };

  // What our global options object looks like
  export interface Options {
    defaultSidebarState: SidebarOpts;
  };

}
