/*
  View for a team report
*/

module Esper.Views {

  interface Props {
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

      return <div id="reports-page" className="esper-full-screen minus-nav">
        <Components.Sidebar className="esper-shade">
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
          { (() => {
            if (eventData.hasError) {
              return <Msg>
                <i className="fa fa-fw fa-warning"></i>{" "}
                { Text.ChartFetchError }
              </Msg>;
            }
            if (eventData.isBusy) {
              return <Msg>
                <span className="esper-spinner esper-inline" />{" "}
                { Text.ChartFetching }
              </Msg>;
            }
            return this.renderMain(eventData);
          })() }
        </div>

      </div>;
    }

    renderPeriodSelector() {
      return <div className={"esper-content-header period-selector " +
                             "row fixed clearfix"}>
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
      </div>;
    }

    renderMain(eventData: Types.EventListData) {
      var calendars = Option.matchList(
        Stores.Calendars.list(this.props.teamId)
      );
      var team = Stores.Teams.require(this.props.teamId);
      return <div className="report">
        <TopLine period={this.props.period} eventData={eventData} />
        <LabelsReport
          period={this.props.period} teamId={this.props.teamId}
          eventData={eventData}
        />
        { calendars.length > 1 ? <CalendarsReport
          period={this.props.period} teamId={this.props.teamId}
          eventData={eventData}
          calendars={calendars}
        /> : null}
        <GuestsReport
          period={this.props.period} teamId={this.props.teamId}
          eventData={eventData}
        />
        <DomainsReport
          period={this.props.period} teamId={this.props.teamId}
          eventData={eventData}
        />
        <GuestCountReport
          period={this.props.period} teamId={this.props.teamId}
          eventData={eventData}
        />
        <DurationReport
          period={this.props.period} teamId={this.props.teamId}
          eventData={eventData}
        />
        <RatingsReport
          period={this.props.period} teamId={this.props.teamId}
          eventData={eventData}
        />
        <NotesReport events={eventData.events} teams={[team]} />
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

  // Wrapper around error messages
  function Msg({children}: { children?: JSX.Element|JSX.Element[]}) {
    return <div className="esper-expanded esper-no-content">
      <div className="panel-body">
        { children }
      </div>
    </div>;
  }


  // Event bar at top of report with number of events + hours
  function TopLine({period, eventData} : {
    period: Types.SinglePeriod|Types.CustomPeriod;
    eventData: Types.EventListData;
  }) {
    return <div className="esper-section topline">
      <div className="aggregate-metrics clearfix">
        <h3 className="pull-left">
          { Text.events(eventData.events.length) }
        </h3>
        <h3 className="pull-right">
          { Text.hours(EventStats.toHours(
              EventStats.aggregateDuration(eventData.events)
          )) }
        </h3>
      </div>
      <Components.EventTimeline
        period={period}
        events={eventData.events}
      />
    </div>;
  }


  function LabelsReport({period, eventData, teamId} : {
    period: Types.SinglePeriod|Types.CustomPeriod;
    eventData: Types.EventListData;
    teamId: string;
  }) {
    var opts = EventStats.defaultCalcOpts();
    opts.labels.none = false;
    var periods = [{
      period: period,
      current: true,
      isBusy: eventData.isBusy,
      hasError: eventData.hasError,
      data: new EventStats.LabelDurationCalc(eventData.events, opts),
      total: 0 // Not used
    }];

    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.ChartLabels }</h3>
        <Components.LabelChartInsight periods={periods} />
        <SeeMoreLink
          fn={Paths.Time.labelsChart} type="percent"
          period={period} teamId={teamId}
        />
      </div>
      <Components.LabelPercentChart periods={periods} simplified={true} />
    </div>
  }


  function CalendarsReport({calendars, period, eventData, teamId} : {
    calendars: ApiT.GenericCalendar[];
    period: Types.SinglePeriod|Types.CustomPeriod;
    eventData: Types.EventListData;
    teamId: string;
  }) {
    var opts = EventStats.defaultCalcOpts();
    var periods = [{
      period: period,
      current: true,
      isBusy: eventData.isBusy,
      hasError: eventData.hasError,
      data: new EventStats.CalendarDurationCalc(eventData.events, opts),
      total: 0 // Not used
    }];

    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.ChartCalendars }</h3>
        <Components.CalendarChartInsight
          calendars={calendars}
          periods={periods}
        />
        <SeeMoreLink
          fn={Paths.Time.calendarsChart} type="percent"
          period={period} teamId={teamId}
        />
      </div>
      <Components.CalendarPercentChart
        calendars={calendars}
        periods={periods}
        simplified={true}
      />
    </div>
  }


  function GuestsReport({period, eventData, teamId} : {
    period: Types.SinglePeriod|Types.CustomPeriod;
    eventData: Types.EventListData;
    teamId: string;
  }) {
    var opts = _.extend(EventStats.defaultCalcOpts(), {
      nestByDomain: false
    }) as EventStats.DomainNestOpts ;
    var periods = [{
      period: period,
      current: true,
      isBusy: eventData.isBusy,
      hasError: eventData.hasError,
      data: new EventStats.GuestDurationCalc(eventData.events, opts),
      total: 0 // Not used
    }];

    return <div className="esper-section report-section wide">
      <div className="description">
        <h3>{ Text.ChartGuests }</h3>
        <Components.GuestChartInsight periods={periods} />
        <SeeMoreLink
          fn={Paths.Time.guestsChart} type="absolute"
          period={period} teamId={teamId}
        />
      </div>
      <Components.GuestHoursChart periods={periods} simplified={true} />
    </div>
  }


  function DomainsReport({period, eventData, teamId} : {
    period: Types.SinglePeriod|Types.CustomPeriod;
    eventData: Types.EventListData;
    teamId: string;
  }) {
    var opts = _.extend(EventStats.defaultCalcOpts(), {
      nestByDomain: true
    }) as EventStats.DomainNestOpts;
    opts.domains.none = false;
    var periods = [{
      period: period,
      current: true,
      isBusy: eventData.isBusy,
      hasError: eventData.hasError,
      data: new EventStats.GuestDurationCalc(eventData.events, opts),
      total: 0 // Not used
    }];

    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.GuestDomains }</h3>
        <Components.DomainChartInsight periods={periods} />
        <SeeMoreLink
          fn={Paths.Time.labelsChart} type="percent"
          period={period} teamId={teamId}
        />
      </div>
      <Components.GuestPercentChart periods={periods} simplified={true} />
    </div>
  }


  function GuestCountReport({period, eventData, teamId} : {
    period: Types.SinglePeriod|Types.CustomPeriod;
    eventData: Types.EventListData;
    teamId: string;
  }) {
    var opts = EventStats.defaultCalcOpts();
    opts.guestCounts.none = false;

    var chartPeriods = [{
      period: period,
      current: true,
      isBusy: eventData.isBusy,
      hasError: eventData.hasError,
      data: new EventStats.GuestCountDurationCalc(eventData.events, opts),
      total: 0 // Not used
    }];
    var insightPeriods = [{
      period: period,
      current: true,
      isBusy: eventData.isBusy,
      hasError: eventData.hasError,
      data: new EventStats.GuestCountAnnotationCalc(eventData.events, opts),
      total: 0 // Not used
    }];
    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.ChartGuestsCount  }</h3>
        <Components.GuestCountChartInsight periods={insightPeriods} />
        <SeeMoreLink
          fn={Paths.Time.guestsCountChart} type="percent"
          period={period} teamId={teamId}
        />
      </div>
      <Components.GuestCountPercentChart
        periods={chartPeriods}
        simplified={true}
      />
    </div>
  }


  function DurationReport({period, eventData, teamId} : {
    period: Types.SinglePeriod|Types.CustomPeriod;
    eventData: Types.EventListData;
    teamId: string;
  }) {
    var opts = EventStats.defaultCalcOpts();
    var periods = [{
      period: period,
      current: true,
      isBusy: eventData.isBusy,
      hasError: eventData.hasError,
      data: new EventStats.DurationBucketCalc(eventData.events, opts),
      total: 0 // Not used
    }];
    return <div className="esper-section report-section wide">
      <div className="description">
        <h3>{ Text.ChartDuration }</h3>
        <Components.DurationChartInsight periods={periods} />
        <SeeMoreLink
          fn={Paths.Time.durationsChart} type="absolute"
          period={period} teamId={teamId}
        />
      </div>
      <Components.DurationStack
        periods={periods}
        eventOnClick={Charting.onEventClick}
      />
    </div>
  }


  function RatingsReport({period, eventData, teamId} : {
    period: Types.SinglePeriod|Types.CustomPeriod;
    eventData: Types.EventListData;
    teamId: string;
  }) {
    var opts = EventStats.defaultCalcOpts();
    opts.ratings.none = false;
    var periods = [{
      period: period,
      current: true,
      isBusy: eventData.isBusy,
      hasError: eventData.hasError,
      data: new EventStats.RatingDurationCalc(eventData.events, opts),
      total: 0 // Not used
    }];

    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.ChartRatings }</h3>
        <Components.RatingChartInsight periods={periods} />
        <SeeMoreLink
          fn={Paths.Time.ratingsChart} type="percent"
          period={period} teamId={teamId}
        />
      </div>
      <Components.RatingPercentChart
        periods={periods}
        simplified={true}
      />
    </div>
  }

  // List all events with notes
  function NotesReport({events, teams} : {
    events: Types.TeamEvent[];
    teams: ApiT.Team[];
  }) {
    events = _.filter(events, (e) => e.feedback && e.feedback.notes);
    return <div className="esper-section report-section wide">
      <h3>{ Text.NotesHeading }</h3>
      { _.isEmpty(events) ?
        <p>{ Text.NoNotesMessage }</p> :
        <div>
          <p>{ Text.NotesDescription }</p>
          <Components.EventList
            events={events}
            teams={teams}
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


  function SeeMoreLink({fn, period, teamId, type}: {
    fn: (opts: Paths.Time.chartPathOpts) => Paths.Path;
    period: Period.Single|Period.Custom;
    teamId: string;
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
    let opts = type ? { jsonQuery: { type: type }} : {}
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
