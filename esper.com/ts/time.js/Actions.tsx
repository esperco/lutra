/*
  Base namespace for actions -- in particular, actions that render a view
  or do other one-off or asynchronous things necessary to render a view.
*/

/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Views.Header.tsx" />
/// <reference path="./Views.Footer.tsx" />

module Esper.Actions {
  // Set defaults for header and footer render
  export function render(main: React.ReactElement<any>,
                         header?: React.ReactElement<any>,
                         footer?: React.ReactElement<any>) {
    if (header !== null) { // Null => intentionally blank
      header = header || <Views.Header />;
    }
    if (footer !== null) {
      footer = footer || <Views.Footer />;
    }
    Layout.render(main, header, footer);
  }


  /////

  /*
    Interface for filtering out a bunch of events
  */
  export interface EventFilterJSON {
    cals?: {
      teamId: string;
      calId: string
    }[];
    start?: number; // UTC time
    end?: number;   // UTC time
    labels?: string[];
    unlabeled?: boolean;
    allLabels?: boolean;
    filterStr?: string;
  }

  /*
    No guarantee that user input respects typing for EventFilterQuery pulled
    from querystring, so handling code should be robust.

    Also sets defaults for missing variables.
  */
  export function cleanEventFilterJSON(params?: EventFilterJSON) {
    params = params || {};

    var cals: Calendars.CalSelection[] = [];
    _.each(params.cals, (c) => {
      if (_.isString(c.teamId) && _.isString(c.calId)) {
        cals.push(c);
      }
    });
    if (! cals.length) {
      Option.cast(Calendars.defaultSelection()).match({
        none: () => null,
        some: (d) => cals.push(d)
      });
    }
    params.cals = cals;

    var duration = params.end - params.start;
    if (isNaN(duration) || duration <= 0 ||
        duration > 1000 * 60 * 60 * 24 * 32) {
      params.start = moment().startOf('month').valueOf();
      params.end = moment().endOf('month').valueOf();
    }

    return params;
  }
}
