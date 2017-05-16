/*
  View for a team report
*/

module Esper.Views {

  interface Props {
    labels: Params.ListSelectJSON;
    teamId: string;
    period: Types.Period;
  }

  export class Report extends ReactHelpers.Component<Props, {}> {
    renderWithData() {
      let team = Stores.Teams.require(this.props.teamId);
      let { period, labels } = this.props;
      let cals = _.map(team.team_timestats_calendars, (calId) => ({
        calId: calId,
        teamId: this.props.teamId
      }));
      let { eventsForRanges, hasError, isBusy } =
        Stores.Events.require({ cals, period });

      // If calendars not ready yet, treat as "isBusy"
      let calOpt = Stores.Calendars.list(this.props.teamId);
      if (calOpt.isNone()) { isBusy = true; }
      let calendars = calOpt.unwrapOr([]);

      // Report label selector and chart are both "charts" that filter by label
      let extra = Charting.defaultExtras(
        this.props.teamId, Charting.GroupByLabel
      );
      extra.labels = labels;

      let chartProps: Types.ChartProps = {
        eventsForRanges, hasError, isBusy,
        team, calendars, period, extra,
        groupBy: Charting.GroupByLabel,
        simplified: true
      }

      let subscription = team.team_api.team_subscription;

      let seeMoreHintDismissed = Stores.Hints.get('SeeMoreLinkHint');

      return <div id="reports-page" className="esper-expanded">
        <Components.Sidebar side="left" className="esper-shade">
          <div className="sidebar-minus-bottom-menu">
            <UnconfirmedLink eventsForRanges={eventsForRanges} />
            <div className="esper-panel-section">
              <div className="esper-header">
                <i className="fa fa-fw fa-left fa-tags" />
                { Text.ChartLabels }
              </div>
              <Components.ChartSelector
                { ...chartProps }
                updateFn={(x) => Route.nav.query({ labels: x.labels })}
              />
            </div>
            <HiddenLink eventsForRanges={eventsForRanges} />
          </div>

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
          <div className="esper-content-header">
            <Components.PeriodSelector
              minDate={Config.getMinDate(subscription.plan)}
              maxDate={Config.MAX_DATE}
              isLimited={Config.disableAdvancedFeatures(subscription.plan)}
              onLimitClick={
                () => Actions.Charts.renderPlanUpgradeModal(subscription.cusid)
              }
              period={this.props.period}
              updateFn={(p) => this.update({ period: p })}
              hintDismissed={Stores.Hints.get('PeriodSelectorHint')}
            />
          </div>
          <div className="esper-expanded">
            <ReportMain
              { ..._.extend(chartProps, { seeMoreHintDismissed }) as ReportMainProps } />
          </div>
        </div>

      </div>;
    }

    update(params: {
      teamId?: string;
      period?: Types.Period;
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


  interface ReportMainProps extends Types.ChartProps {
    seeMoreHintDismissed: boolean;
  }

  /*
    Report is a "chart" because it is dependent on label calculation
  */
  class ReportMain extends
        Components.DataChart<Types.GroupState, ReportMainProps> {
    getCalc(props: Types.ChartProps): Calc<Types.GroupState> {
      return EventStats.defaultGroupDurationCalc(
        props.eventsForRanges,
        Charting.getFilterFns(props),
        (e) => Params.applyListSelectJSON(
          Stores.Events.getLabelIds(e),
          props.extra.labels
        )
      );
    }

    /*
      Don't update if props are mostly the same. This should be by-passed if
      calc is firing because it calls forceUpdate
    */
    shouldCalcUpdate(newProps: ReportMainProps) {
      return !Charting.eqProps(newProps, this.props);
    }

    renderResult({group}: {group: Types.RangesGroup}) {
      // New eventsForRange using filtered results
      let props = _.clone(this.props);
      props.eventsForRanges = _.isEmpty(this.props.eventsForRanges) ? [] :
        [{
          range: this.props.eventsForRanges[0].range,
          events: group.all.events
        }];

      return <div className="report">
        <TopLine group={group} props={props} />
        <LabelsReport group={group} props={props} />
        { props.calendars.length > 1 ?
          <CalendarsReport {...props} />
          : null }
        <GuestsReport {...props} />
        <DomainsReport {...props} />
        <GuestCountReport {...props} />
        <DurationReport {...props} />
        {/* <RatingsReport {...props} /> */}
        {/* <NotesReport {...props} /> */}
      </div>;
    }
  }


  // Event bar at top of report with number of events + hours
   function TopLine({ group, props } : {
    group: Types.RangesGroup;
    props: Types.ChartProps;
  }) {
    return <div className="esper-section topline">
      <div className="aggregate-metrics clearfix">
        <h3 className="pull-left">
          { Text.events(group.all.totalUnique) }
        </h3>
        <h3 className="pull-right">
          { Text.hours(EventStats.toHours(group.all.totalValue)) }
        </h3>
      </div>
      <Components.EventTimeline group={group} props={props} />
    </div>;
  }

  /*
    Special case of sub-report since labels are used to filter everything
    else. Just pass on existing group rather than than re-calculate
  */
  function LabelsReport({ group, props } : {
    group: Types.RangesGroup;
    props: Types.ChartProps;
  }) {
    let series = Charting.singleGroupSeries(group, props, {
      yFn: EventStats.toHours
    });
    let altExport = function() {
      var subscription = props.team.team_api.team_subscription;
      if (Config.disableAdvancedFeatures(subscription.plan)) {
        Actions.Charts.renderPlanUpgradeModal(subscription.cusid);
        return false;
      }
      return true;
    };

    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.ChartLabels }</h3>
        <p>{ Text.ChartLabelsDescription }</p>
        <Components.LabelChartInsight {...props} />
        <Components.Hint text={Text.SeeMoreHintText}
            dismissed={Stores.Hints.get('SeeMoreLinkHint')}
            onDismiss={() => Stores.Hints.set('SeeMoreLinkHint', true)}>
          <SeeMoreLink {...props} />
        </Components.Hint>
      </div>
      <div className="chart-content">
        { group.all.totalUnique === 0 ?
          <Components.ChartMsg>{Text.ChartNoData}</Components.ChartMsg> :
          <Components.PieChart
            series={series}
            altExport={altExport}
            simplified={true}
            yAxis={`${Charting.GroupByLabel.name} (${Text.ChartPercentUnit})`}
          /> }
      </div>
    </div>;
  }

  function CalendarsReport(props: Types.ChartProps) {
    props = _.clone(props);
    props.groupBy = Charting.GroupByCalendar;
    props.extra = Charting.defaultExtras(props.team.teamid, props.groupBy);

    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.ChartCalendars }</h3>
        <p>{ Text.ChartCalendarsDescription }</p>
        <Components.CalendarChartInsight {...props} />
        <SeeMoreLink {...props as Types.ChartProps} />
      </div>
      <Components.PieDurationChart {...props} />
    </div>
  }

  function GuestsReport(props: Types.ChartProps) {
    props = _.clone(props);
    props.groupBy = Charting.GroupByGuest;
    props.extra = Charting.defaultExtras(props.team.teamid, props.groupBy);
    props.extra.type = "absolute";

    return <div className="esper-section report-section wide">
      <div className="description">
        <h3>{ Text.ChartGuests }</h3>
        <p>{ Text.ChartGuestsDescription }</p>
        <Components.GuestChartInsight {...props} />
        <SeeMoreLink {...props as Types.ChartProps} />
      </div>
      <Components.BarDurationChart {...props} />
    </div>
  }

  function DomainsReport(props: Types.ChartProps) {
    props = _.clone(props);
    props.groupBy = Charting.GroupByDomain;
    props.extra = Charting.defaultExtras(props.team.teamid, props.groupBy);

    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.GuestDomains }</h3>
        <p>{ Text.ChartDomainsDescription }</p>
        <Components.DomainChartInsight {...props} />
        <SeeMoreLink {...props as Types.ChartProps} />
      </div>
      <Components.PieDurationChart {...props} />
    </div>
  }

  function GuestCountReport(props: Types.ChartProps) {
    props = _.clone(props);
    props.groupBy = Charting.GroupByGuestCount;
    props.extra = Charting.defaultExtras(props.team.teamid, props.groupBy);

    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.ChartGuestsCount  }</h3>
        <p>{ Text.ChartGuestsCountDescription }</p>
        <Components.GuestCountChartInsight {...props} />
        <SeeMoreLink {...props as Types.ChartProps} />
      </div>
      <Components.PieDurationChart {...props} />
    </div>
  }

  function DurationReport(props: Types.ChartProps) {
    props = _.clone(props);
    props.groupBy = Charting.GroupByDuration;
    props.extra = Charting.defaultExtras(props.team.teamid, props.groupBy);

    return <div className="esper-section report-section wide">
      <div className="description">
        <h3>{ Text.ChartDuration }</h3>
        <p>{ Text.ChartDurationDescription }</p>
        <Components.DurationChartInsight {...props} />
        <SeeMoreLink {...props as Types.ChartProps} />
      </div>
      <Components.DurationStack {...props}
        eventOnClick={Charting.onEventClick}
      />
    </div>
  }

  /*function RatingsReport(props: Types.ChartProps) {
    props = _.clone(props);
    props.groupBy = Charting.GroupByRating;
    props.extra = Charting.defaultExtras(props.team.teamid, props.groupBy);

    return <div className="esper-section report-section">
      <div className="description">
        <h3>{ Text.ChartRatings }</h3>
        <p>{ Text.ChartRatingsDescription }</p>
        <Components.RatingChartInsight {...props} />
        <SeeMoreLink {...props as Types.ChartProps}
                     groupBy={Charting.GroupByRating} />
      </div>
      <Components.PieDurationChart {...props} />
    </div>
  }

  // List all events with notes
  function NotesReport(props: Types.ChartProps) {
    let events = _.isEmpty(props.eventsForRanges) ? [] :
      props.eventsForRanges[0].events; // First range only
    events = _.filter(events, (e) => e.feedback && e.feedback.notes);
    return <div className="esper-section report-section wide">
      <h3>{ Text.NotesHeading }</h3>
      { _.isEmpty(events) ?
        <p>{ Text.NoNotesMessage }</p> :
        <div>
          <p>{ Text.NotesDescription }</p>
          <Components.EventList
            events={events}
            teams={[props.team]}
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
  }*/

  function SeeMoreLink(props: Types.ChartProps) {
    let {path, opts} = Charting.updateChartPath(props, {});
    let href = Route.nav.href(path, opts);

    return <a className="more-link" href={href}
      onClick={() => Route.nav.go(path, opts)}>
      <i className="fa fa-fw fa-left fa-caret-right" />
      { Text.SeeMoreLinkText }
    </a>;
  }

  // Link to launch auto-confirm modal
  interface ModalLinkProps {
    eventsForRanges: Types.EventsForRange[];
  }

  class UnconfirmedLink extends
    Components.CalcUI<Types.CounterState, ModalLinkProps>
  {
    getCalc(props: ModalLinkProps) {
      let eventsForRanges = props.eventsForRanges;
      return EventStats.simpleCounterCalc(eventsForRanges, [
        Stores.Events.needsConfirmation
      ]);
    }

    // Button to manually launch
    render() {
      return this.state.result.mapOr(
        null,
        (counts) => counts.total > 0 ?
          <div className="esper-panel-section">
            <div className="esper-select-menu">
              <div className="esper-selectable unconfirmed-link" onClick={
                () => this.launchModal(counts.events)
              }>
                <i className="fa fa-fw fa-left fa-flash" />
                { Text.Unconfirmed }
                <Components.Badge
                  text={counts.total.toString()}
                />
              </div>
            </div>
          </div> : null
      );
    }

    launchModal(events: Types.TeamEvent[]) {
      Layout.renderModal(Containers.confirmListModal(events));
    }
  }

  class HiddenLink extends
    Components.CalcUI<Types.CounterState, ModalLinkProps>
  {
    getCalc(props: ModalLinkProps) {
      let eventsForRanges = props.eventsForRanges;
      return EventStats.simpleCounterCalc(eventsForRanges, [
        (e) => !Stores.Events.isActive(e)
      ]);
    }

    // Button to manually launch
    render() {
      return this.state.result.mapOr(
        null,
        (counts) => counts.total > 0 ?
          <div className="esper-panel-section">
            <div className="esper-select-menu">
              <div className="esper-selectable hidden-link" onClick={
                () => this.launchModal(counts.events)
              }>
                <i className="fa fa-fw fa-left fa-eye-slash" />
                { Text.HiddenEvents }
                <Components.BadgeLight
                  text={counts.total.toString()}
                />
              </div>
            </div>
          </div> : null
      );
    }

    launchModal(events: Types.TeamEvent[]) {
      Layout.renderModal(Containers.confirmListModal(events));
    }
  }
}
