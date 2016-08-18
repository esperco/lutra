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
      return <div>
        { eventData.events.length }
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
}
