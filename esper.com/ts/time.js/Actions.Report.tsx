/*
  Actions for all-the-charts / report page
*/

/// <reference path="./Actions.tsx" />

module Esper.Actions {
  const analyticsId = "report-analytics-id";

  export function renderReport({teamId, period, extra}: {
    teamId: string;
    period: Types.Period;
    extra?: any;
  }) {
    // Fetch events
    var team = Stores.Teams.require(teamId);
    var calIds = team.team_timestats_calendars;
    _.each(calIds,
      (_id) => Stores.Events.fetchPredictions({ teamId, period })
    );

    extra = extra || {};
    var labels = Params.cleanListSelectJSON(extra.labels);

    // Single period only
    period = Period.toSingle(period);

    // Render view
    render(<Views.Report teamId={teamId} period={period} labels={labels} />);

    // Delay tracking by 2 seconds to ensure user is actually looking at list
    Util.delayOne(analyticsId, function() {
      Analytics.page(Analytics.Page.Report, {
        interval: period.interval
      });
    }, 2000);
  }
}
