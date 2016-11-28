module Esper.Actions {

  const analyticsId = "list-analytics-id";

  interface Props {
    teamId: string;
    period: Types.Period;
    extra?: any;
  }

  export function renderWeek(props: Props) {
    renderList("week", props);
  }

  export function renderMonth(props: Props) {
    renderList("month", props);
  }

  export function renderAgenda(props: Props) {
    renderList("agenda", props);
  }

  function renderList(view: "week"|"month"|"agenda", {teamId, period, extra}: {
    teamId: string;
    period: Types.Period;
    extra?: any;
  }) {
    // View affects period
    var [start, end] = Period.bounds(period);
    if (view === "month") {
      period = Period.fromDates("month", start, end);
    } else if (view === "week") {
      period = Period.fromDates("week", start, end);
    }

    // Single period only
    period = Period.toSingle(period);

    // Fetch events
    var team = Stores.Teams.require(teamId);

    extra = extra || {};
    var labels = Params.cleanListSelectJSON(extra.labels);
    var calIds = Params.cleanCalIds(teamId, extra.calIds || "");
    var filterStr = Params.cleanFilterStrJSON(extra).filterStr;
    var hideInactive = Params.cleanBoolean(extra.hideInactive);
    Stores.Events.fetchPredictions({ teamId, period })

    // Render view
    render(<Views.List
      teamId={teamId}
      calIds={calIds}
      period={period}
      labels={labels}
      filterStr={filterStr}
      hideInactive={hideInactive}
      view={view}
    />);

    /////

    // Delay tracking by 2 seconds to ensure user is actually looking at list
    Util.delayOne(analyticsId, function() {
      Analytics.page(Analytics.Page.EventList, {
        calendars: calIds.length,
        interval: period.interval,
        relativePeriod: period.start -
          Period.now(period.interval).start,
        hasFilterStr: !!filterStr,
        hasLabelFilter: !(labels.all && labels.none),
        view: view
      });
    }, 2000);
  }
}
