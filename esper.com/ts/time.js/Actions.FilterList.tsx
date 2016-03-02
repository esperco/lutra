/*
  Actions based on routes -- stick more verbose code here so Route.tsx can
  stay relatively short and easy to parse for routing patterns.
*/

/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Views.FilterList.tsx" />

module Esper.Actions {

  /* List action => render a list of events */

  /*
    Interface for query params expected by filter route after being parsed
    as JSON. No guarantee that user input respects typing, so handling code
    should be robust.
  */
  export interface FilterListQS {
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

  export function FilterList(params?: FilterListQS) {
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

    var period = (() => {
      var duration = params.end - params.start;
      if (isNaN(duration) || duration <= 0 ||
          duration > 1000 * 60 * 60 * 24 * 32) {
        return {
          start: moment().startOf('month').toDate(),
          end: moment().endOf('month').toDate()
        };
      } else {
        return {
          start: new Date(params.start),
          end: new Date(params.end)
        }
      }
    })();

    // Trigger async load
    _.each(cals, (c) =>
      Events.fetch(c.teamId, c.calId, period.start, period.end)
    );

    var labels = _.filter(params.labels, (l) => _.isString(l));
    var unlabled = !!params.unlabeled;
    var allLabels = !!params.allLabels;

    // Default => select all
    if (_.isUndefined(params.labels) &&
        _.isUndefined(params.unlabeled) &&
        _.isUndefined(params.allLabels))
    {
      allLabels = true;
      unlabled = true;
    }

    var filterStr = params.filterStr || "";

    var duration = moment.duration(period.end.getTime() -
                                   period.start.getTime()).humanize();
    var start = moment(period.start).fromNow();
    Analytics.page(Analytics.Page.EventList, {
      calendars: cals.length,
      allLabels: allLabels,
      unlabeled: unlabled,
      numLabels: labels.length,
      filterStr: filterStr,
      periodLength: duration,
      start: start
    });

    return <Views.FilterList
      calendars={cals}
      start={period.start}
      end={period.end}
      filterStr={filterStr}
      labels={labels}
      unlabeled={unlabled}
      allLabels={allLabels}
    />;
  }

}
