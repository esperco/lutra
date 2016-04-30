/*
  Base namespace for actions -- in particular, actions that render a view
  or do other one-off or asynchronous things necessary to render a view.
*/

/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Views.Header.tsx" />

module Esper.Actions {
  // Set defaults for header and footer render
  export function render(main: React.ReactElement<any>,
                         header?: React.ReactElement<any>,
                         footer?: React.ReactElement<any>) {
    if (header !== null) { // Null => intentionally blank
      header = header || <Views.Header />;
    }
    Layout.render(main, header, footer);
  }
}
