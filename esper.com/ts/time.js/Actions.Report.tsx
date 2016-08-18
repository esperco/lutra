/*
  Actions for all-the-charts / report page
*/

/// <reference path="./Actions.tsx" />

module Esper.Actions {
  const analyticsId = "report-analytics-id";

  export function renderReport({teamId, period}: {
    teamId: string;
    period: Types.SinglePeriod|Types.CustomPeriod;
  }) {
    render(<Views.Report teamId={teamId} period={period} />);

    // Delay tracking by 2 seconds to ensure user is actually looking at list
    Util.delayOne(analyticsId, function() {
      Analytics.page(Analytics.Page.EventList, {
        interval: period.interval
      });
    }, 2000);
  }
}
