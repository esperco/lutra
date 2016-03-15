/*
  Actions based on routes -- stick more verbose code here so Route.tsx can
  stay relatively short and easy to parse for routing patterns.
*/

/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Layout.tsx" />
/// <refernece path="./Actions" />
/// <reference path="./Views.Charts.tsx" />

module Esper.Actions {

  /*
    Interface for query params expected by filter route after being parsed
    as JSON. No guarantee that user input respects typing, so handling code
    should be robust.
  */
  interface ChartParams {
    start: number;  // UTC time
    end: number;    // UTC time

    // Selected team-calendar combos
    calendars: Calendars.CalSelection[];

    // Additional field to make static interval explicit (if applicable)
    interval?: TimeStats.Interval;

    // Applicable to labeled charts only
    selectedLabels?: string[];
    unlabeled?: boolean;
    allLabels?: boolean;
  }

}
