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
      return <div className="report">
        <TopLine period={this.props.period} eventData={eventData} />
        <LabelsReport period={this.props.period} eventData={eventData} />
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
      <Components.EventBar
        period={period}
        events={eventData.events}
      />
    </div>;
  }


  function LabelsReport({period, eventData} : {
    period: Types.SinglePeriod|Types.CustomPeriod;
    eventData: Types.EventListData;
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

    return <div className="esper-section">
      <div className="description">
        <h3>{ Text.ChartLabels }</h3>
        <Components.LabelChartInsight periods={periods} />
      </div>
      <Components.LabelPercentChart periods={periods} simplified={true} />
    </div>
  }
}
