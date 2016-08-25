/*
  Actions for all-the-charts / report page
*/

/// <reference path="./Actions.tsx" />

module Esper.Actions {
  const analyticsId = "report-analytics-id";

  export function renderReport({teamId, period, extra}: {
    teamId: string;
    period: Types.SinglePeriod|Types.CustomPeriod;
    extra?: any;
  }) {
    // Fetch events
    var team = Stores.Teams.require(teamId);
    var calIds = team.team_timestats_calendars;
    _.each(calIds, (_id) => Stores.Events.fetchPredictions({
      teamId: teamId,
      period: period
    }));

    extra = extra || {};
    var labels = Params.cleanListSelectJSON(extra.labels);

    // Render view
    render(<Views.Report teamId={teamId} period={period} labels={labels} />);

    // Delay tracking by 2 seconds to ensure user is actually looking at list
    Util.delayOne(analyticsId, function() {
      Analytics.page(Analytics.Page.EventList, {
        interval: period.interval
      });
    }, 2000);
  }
}
