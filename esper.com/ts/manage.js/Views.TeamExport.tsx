/*
  Label settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class TeamExport extends TeamSettings<{}> {
    pathFn = Paths.Manage.Team.exportCSV;

    renderMain(team: ApiT.Team) {
      let plan = team.team_api.team_subscription.plan;
      if (Config.allowCSV(plan)) {
        let props = {
          team,
          start: Config.getMinDate(plan),
          end: Config.MAX_DATE
        };

        return <div className="panel panel-default"><div className="panel-body">
          <CSVDownload {...props} />
        </div></div>;
      }

      // Not allowed in certain plans
      return <div className="panel panel-default"><div className="panel-body">
        <div className="alert alert-warning">
          <a href={Paths.Manage.Team.pay({teamId: team.teamid}).href}>
            { Text.ExportCSVNotAllowed }
          </a>
        </div>
      </div></div>;
    }
  }


  /////

  interface Props {
    team: ApiT.Team;
    start: Date;
    end: Date;
  }

  class CSVDownload extends ReactHelpers.Component<Props, {
    busy: boolean;
    data?: string;
  }> {
    constructor(props: Props) {
      super(props);
      this.state = {
        busy: false
      };
    }

    render() {
      let startM = moment(this.props.start);
      let endM = moment(this.props.end);
      let elms: JSX.Element[] = [];

      while (endM.diff(startM) > 0) {
        let start = startM.clone();
        let end = startM.clone().endOf('year');
        if (endM.diff(end) < 0) { end = endM.clone(); }

        elms.push(this.renderYear(start.toDate(), end.toDate()));

        // Go to start of next year
        startM = startM.startOf('year').add(1, 'year');
      }

      return <div className="esper-section">{
        this.state.busy ?
        <div className="esper-spinner" /> :
        <div className="esper-section">
          { this.state.data ?
            <div key="msg" className="esper-panel-section">
              <div className="alert alert-info">
                <a download="esper.csv"
                   href={"data:" + this.state.data}>
                  <i className="fa fa-fw fa-left fa-download" />
                  Download Ready. Click here.
                </a>
              </div>
            </div> :
            <div key="msg" className="esper-panel-section">
              <div className="description">
                { Text.ExportCSVDescription }
              </div>
            </div>
          }
          { elms }
        </div>
      }</div>;
    }

    renderYear(start: Date, end: Date) {
      let startM = moment(start);
      let endM = moment(end);
      let completeYear = (startM.month() === 0 && endM.month() === 11);

      let elms: JSX.Element[] = [];
      let m = startM.clone().startOf('year');
      let year = m.year();

      while (m.year() === year) {
        elms.push(this.renderMonth(
          m.clone().toDate(),
          m.valueOf() >= start.valueOf() && m.valueOf() <= end.valueOf()
        ));

        // Go to start of next month
        m.add(1, 'month');
      }

      return <div key={start.getTime()} className="esper-panel-section">
        <div className="esper-flex-list">
          <a className={completeYear ? "em" : "disabled"}
             onClick={() => completeYear ? this.download(start, end) : null}>
            {year}
          </a>
          { elms }
        </div>
      </div>;
    }

    renderMonth(date: Date, active: boolean) {
      let start = date;
      let end = moment(date).clone().endOf('month').toDate();
      return <a key={date.getTime()} className={active ? "em" : "disabled"}
                onClick={() => active ? this.download(start, end) : null}>
        { moment(date).format("MMM") }
      </a>;
    }

    download(start: Date, end: Date) {
      this.setState({busy: true});
      Api.postForCalendarEventsCSV(this.props.team.teamid, {
        window_start: XDate.toString(start),
        window_end: XDate.toString(end)
      }).done((csv) => this.setState({
        busy: false,
        data: "text/csv;charset=utf-8," + encodeURI(csv)
      })).fail(() => this.setState({
        busy: false
      }));
    }
  }
}
