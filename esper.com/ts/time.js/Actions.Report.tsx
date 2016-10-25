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
    Stores.Events.fetchPredictions({ teamId, period })

      // Then launch confirmation modal if needed
      .done(() => handlePostFetch({ teamId, period }));

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


  // Has auto-label confirmation modal been launched before?
  var confirmationLaunched = false;

  function handlePostFetch({teamId, period}: {
    teamId: string;
    period: Types.Period;
  }) {
    if (Login.data.is_sandbox_user) { // No autolaunch in sandbox mode
      return;
    }

    let team = Stores.Teams.require(teamId);
    let subscription = team.team_api.team_subscription;
    let cals = _.map(team.team_timestats_calendars, (calId) => ({
      calId: calId,
      teamId: teamId
    }));
    let { eventsForRanges } = Stores.Events.require({ cals, period });

    // Calculate unconfirmed events
    let calc = EventStats.simpleCounterCalc(eventsForRanges, [
      Stores.Events.needsConfirmation
    ]);

    // Show correct modal once calculation is done
    calc.onceChange((result) => {
      if (!confirmationLaunched && result.total > 0) {
        confirmationLaunched = true;
        Layout.renderModal(Containers.confirmListModal(result.events, 0, () => {
          // Redirect to payment view
          if (!subscription.active)
            Route.nav.go(Paths.Time.paymentInfo({teamId}));
        }));
      } else if (!subscription.active) {
        Route.nav.go(Paths.Time.paymentInfo({teamId}));
      }
    });

    // Need to manually start since this isn't tied to a view
    calc.start();
  }
}
