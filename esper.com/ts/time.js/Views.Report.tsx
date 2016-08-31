/*
  View for a team report
*/

module Esper.Views {

  interface Props {
    labels: Params.ListSelectJSON;
    teamId: string;
    period: Types.SinglePeriod|Types.CustomPeriod;
  }

  export class Report extends ReactHelpers.Component<Props, {}> {
    renderWithData() {
      var team = Stores.Teams.require(this.props.teamId);
      var cals = _.map(team.team_timestats_calendars, (calId) => ({
        calId: calId,
        teamId: this.props.teamId
      }));
      var eventData = Stores.Events.require({
        cals: cals,
        period: this.props.period
      });
      var labelCountCalc = new EventStats.LabelCountCalc(eventData.events,
        EventStats.defaultCalcOpts());

      var opts = EventStats.defaultCalcOpts({
        labels: this.props.labels
      });
      var labelDurationCalc = new EventStats.LabelDurationCalc(
        eventData.events, opts);

      return <div id="reports-page" className="esper-expanded">
        <Components.Sidebar side="left" className="esper-shade">
          <Components.LabelCalcSelector
            primary={true}
            team={team}
            selected={this.props.labels}
            calculation={labelCountCalc}
            updateFn={(x) => Route.nav.query({ labels: x })}
          />

          <div className="sidebar-bottom-menu">
            <Components.TeamSelector
              teams={Stores.Teams.all()}
              selectedId={this.props.teamId}
              onUpdate={(teamId) => this.update({
                teamId: teamId
              })} />
          </div>
        </Components.Sidebar>

        <div className="esper-content">
          { this.renderPeriodSelector() }
          <div className="esper-expanded">
            <ReportMain
              calendars={
                Option.matchList(Stores.Calendars.list(this.props.teamId))
              }
              team={team}
              labels={this.props.labels}
              periods={[{
                period: this.props.period,
                current: true,
                data: labelDurationCalc,
                hasError: eventData.hasError,
                isBusy: eventData.isBusy,
                total: 0 // Not used
              }]}
            />
          </div>
        </div>

      </div>;
    }

    renderPeriodSelector() {
      return <div className="esper-content-header container-fluid">
        <div className="row period-selector">
          <Components.IntervalOrCustomSelector
            className="col-sm-6"
            period={this.props.period}
            updateFn={(p) => this.update({period: p})}
          />
          <div className="col-sm-6">
            <Components.SingleOrCustomPeriodSelector
              period={this.props.period}
              updateFn={(p) => this.update({period: p})}
            />
          </div>
        </div>
      </div>;
    }

    renderMain(eventData: Types.EventListData) {
      var calendars = Option.matchList(
        Stores.Calendars.list(this.props.teamId)
      );
      var team = Stores.Teams.require(this.props.teamId);
      return <div className="report">

      </div>;
    }

    update(params: {
      teamId?: string;
      period?: Types.SinglePeriod|Types.CustomPeriod;
    }) {
      var newProps = _.extend({}, this.props, params) as Props;
      var periodStr = Params.periodStr(newProps.period);
      Route.nav.go(Paths.Time.report({
        teamId: newProps.teamId,
        interval: periodStr.interval,
        period: periodStr.period
      }));
    }
  }

  /*
    Report is a "chart" because it is dependent on label calculation
  */
  class ReportMain extends Components.DefaultGroupingChart<{
    team: ApiT.Team;
    calendars: ApiT.GenericCalendar[];
    labels: Types.ListSelectJSON;
  }> {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      // Current period only
      let periodGroup = _.find(groups, (g) => g.current);
      let periodData = _.find(this.props.periods, (p) => p.current);
      if (!periodGroup || !periodData) {
        Log.e("No current period")
        return <Components.ErrorMsg />;
      }

      let catProps: CalcProps = {
        calc: periodData.data as EventStats.LabelDurationCalc,
        period: periodGroup.period,
        events: periodGroup.data.events,
        calendars: this.props.calendars,
        team: this.props.team,
        labels: this.props.labels
      };

      return <div className="report">
        <TopLine {...catProps} />
        <LabelsReport {...catProps} />
        { this.props.calendars.length > 1 ?
          <CalendarsReport {...catProps} />
          : null }
        <GuestsReport {...catProps} />
        <DomainsReport {...catProps} />
        <GuestCountReport {...catProps} />
        <DurationReport {...catProps} />
        <RatingsReport {...catProps} />
        <NotesReport {...catProps} />
      </div>;
    }
  }


  // Helper function used by sub-reports to make new PeriodData from cals
  function makePeriodCalc<T,U>({period, calc}: {
    period: Types.SinglePeriod|Types.CustomPeriod;
    calc: EventStats.CalcBase<T,U>;
  }) {
    return [{
      period: period,
      current: true,
      isBusy: false,   // Should not be busy if we get to sub-report level
      hasError: false, // Should not have error if we get to sub-report level
      data: calc,
      total: 0 // Not used
    }];
  }

  /*
    Interface for sub-reports dependent on results from LabelDurationCalc
  */
  interface CalcProps {
    calc: EventStats.LabelDurationCalc;
    period: Types.SinglePeriod|Types.CustomPeriod;
    events: Types.TeamEvent[];
    calendars: ApiT.GenericCalendar[];
    team: ApiT.Team;
    labels: Types.ListSelectJSON;
  }

  // Event bar at top of report with number of events + hours
  function TopLine({period, events} : CalcProps) {
    return <div className="esper-section topline">
      <div className="aggregate-metrics clearfix">
        <h3 className="pull-left">
          { Text.events(events.length) }
        </h3>
        <h3 className="pull-right">
          { Text.hours(EventStats.toHours(
              EventStats.aggregateDuration(events)
          )) }
        </h3>
      </div>
      <Components.EventTimeline
        period={period}
        events={events}
      />
    </div>;
  }

  /*
    Special case of sub-report since labels are used to filter everything
    else. Just pass on existing calculation rather than than re-calculate
  */
  function LabelsReport({period, calc, team, labels} : CalcProps) {
    var periods = makePeriodCalc({ period, calc });
    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.ChartLabels }</h3>
        <p>{ Text.ChartLabelsDescription }</p>
        <Components.LabelChartInsight periods={periods} />
        <SeeMoreLink
          fn={Paths.Time.labelsChart} type="percent"
          period={period} teamId={team.teamid} labels={labels}
        />
      </div>
      <Components.LabelPercentChart periods={periods} simplified={true} />
    </div>
  }

  function CalendarsReport({
    calendars, period, events, team, labels
  } : CalcProps) {
    var opts = EventStats.defaultCalcOpts();
    var calc = new EventStats.CalendarDurationCalc(events, opts)
    var periods = makePeriodCalc({ period, calc });

    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.ChartCalendars }</h3>
        <p>{ Text.ChartCalendarsDescription }</p>
        <Components.CalendarChartInsight
          calendars={calendars}
          periods={periods}
        />
        <SeeMoreLink
          fn={Paths.Time.calendarsChart} type="percent"
          period={period} teamId={team.teamid} labels={labels}
        />
      </div>
      <Components.CalendarPercentChart
        calendars={calendars}
        periods={periods}
        simplified={true}
      />
    </div>
  }

  function GuestsReport({period, events, team, labels} : CalcProps) {
    var opts = _.extend(EventStats.defaultCalcOpts({
      domains: { all: true, some: [], none: false }
    }), {
      nestByDomain: false
    }) as EventStats.DomainNestOpts;
    var calc = new EventStats.GuestDurationCalc(events, opts);
    var periods = makePeriodCalc({ period, calc });

    return <div className="esper-section report-section wide">
      <div className="description">
        <h3>{ Text.ChartGuests }</h3>
        <p>{ Text.ChartGuestsDescription }</p>
        <Components.GuestChartInsight periods={periods} />
        <SeeMoreLink
          fn={Paths.Time.guestsChart} type="absolute"
          period={period} teamId={team.teamid} labels={labels}
        />
      </div>
      <Components.GuestHoursChart periods={periods} simplified={true} />
    </div>
  }

  function DomainsReport({period, events, team, labels} : CalcProps) {
    var opts = _.extend(EventStats.defaultCalcOpts({
      domains: { all: true, some: [], none: false }
    }), {
      nestByDomain: true
    }) as EventStats.DomainNestOpts;
    var calc = new EventStats.GuestDurationCalc(events, opts);
    var periods = makePeriodCalc({ period, calc });

    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.GuestDomains }</h3>
        <p>{ Text.ChartDomainsDescription }</p>
        <Components.DomainChartInsight periods={periods} />
        <SeeMoreLink
          fn={Paths.Time.labelsChart} type="percent"
          period={period} teamId={team.teamid} labels={labels}
        />
      </div>
      <Components.GuestPercentChart periods={periods} simplified={true} />
    </div>
  }

  function GuestCountReport({period, events, team, labels} : CalcProps) {
    var opts = EventStats.defaultCalcOpts({
      guestCounts: { all: true, some: [], none: false }
    });
    var chartPeriods = makePeriodCalc({ period,
      calc: new EventStats.GuestCountDurationCalc(events, opts)
    });
    var insightPeriods = makePeriodCalc({ period,
      calc: new EventStats.GuestCountAnnotationCalc(events, opts)
    });

    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.ChartGuestsCount  }</h3>
        <p>{ Text.ChartGuestsCountDescription }</p>
        <Components.GuestCountChartInsight periods={insightPeriods} />
        <SeeMoreLink
          fn={Paths.Time.guestsCountChart} type="percent"
          period={period} teamId={team.teamid} labels={labels}
        />
      </div>
      <Components.GuestCountPercentChart
        periods={chartPeriods}
        simplified={true}
      />
    </div>
  }

  function DurationReport({period, events, team, labels} : CalcProps) {
    var opts = EventStats.defaultCalcOpts();
    var calc = new EventStats.DurationBucketCalc(events, opts);
    var periods = makePeriodCalc({ period, calc });

    return <div className="esper-section report-section wide">
      <div className="description">
        <h3>{ Text.ChartDuration }</h3>
        <p>{ Text.ChartDurationDescription }</p>
        <Components.DurationChartInsight periods={periods} />
        <SeeMoreLink
          fn={Paths.Time.durationsChart} type="absolute"
          period={period} teamId={team.teamid} labels={labels}
        />
      </div>
      <Components.DurationStack
        periods={periods}
        eventOnClick={Charting.onEventClick}
      />
    </div>
  }

  function RatingsReport({
    period, events, team, labels
  } : CalcProps) {
    var opts = EventStats.defaultCalcOpts({
      ratings: { all: true, some: [], none: false }
    });
    var calc = new EventStats.RatingDurationCalc(events, opts);
    var periods = makePeriodCalc({ period, calc });

    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.ChartRatings }</h3>
        <p>{ Text.ChartRatingsDescription }</p>
        <Components.RatingChartInsight periods={periods} />
        <SeeMoreLink
          fn={Paths.Time.ratingsChart} type="percent"
          period={period} teamId={team.teamid} labels={labels}
        />
      </div>
      <Components.RatingPercentChart
        periods={periods}
        simplified={true}
      />
    </div>
  }

  // List all events with notes
  function NotesReport({events, team} : CalcProps) {
    events = _.filter(events, (e) => e.feedback && e.feedback.notes);
    return <div className="esper-section report-section wide">
      <h3>{ Text.NotesHeading }</h3>
      { _.isEmpty(events) ?
        <p>{ Text.NoNotesMessage }</p> :
        <div>
          <p>{ Text.NotesDescription }</p>
          <Components.EventList
            events={events}
            teams={[team]}
            onEventClick={() => events.length && editEventNotes(events[0])}
            onFeedbackClick={() => events.length && editEventNotes(events[0])}
            showFeedback={true}
            showLabels={false}
            showAttendToggle={false}
          />
        </div>
      }
    </div>
  }

  function editEventNotes(event: Types.TeamEvent) {
    Actions.EventLabels.confirm([event]);
    Layout.renderModal(Containers.eventEditorModal([event], {
      minFeedback: false
    }));
  }

  function SeeMoreLink({fn, period, teamId, labels, type}: {
    fn: (opts: Paths.Time.chartPathOpts) => Paths.Path;
    period: Period.Single|Period.Custom;
    teamId: string;
    labels: Types.ListSelectJSON;
    type?: Types.ChartType;
  }) {
    let periodStr = Params.periodStr(period);

    // NB: TeamId should be auto-set to last team
    let path = fn({
      calIds: "default",
      teamId: teamId,
      interval: periodStr.interval,
      period: periodStr.period
    });
    let opts = { jsonQuery: { labels: labels, type: type }};
    let href = Route.nav.href(path, opts);

    return <p>
      <a className="more-link" href={href}
         onClick={() => Route.nav.go(path, opts)}>
        <i className="fa fa-fw fa-left fa-caret-right" />
        { Text.SeeMoreLinkText }
      </a>
    </p>;
  }
}
