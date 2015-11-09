/*
  Component for a FullCalendar rendering
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/ApiC.ts" />
/// <reference path="../marten/ts/XDate.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Calendars.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface CalendarProps {
    teamId: string;
    calId: string;
  }

  interface CalendarState {
    showBusy?: boolean;
    showError?: boolean;
  }

  export abstract class Calendar extends Component<CalendarProps, CalendarState>
  {
    _fcDiv: React.Component<any, any>;

    constructor(props: CalendarProps) {
      super(props);
      this.state = {};
    }

    render() {
      return <div className="fullcalendar-holder">
        <div ref={(c) => this._fcDiv = c}></div>
        {this.renderMessage()}
      </div>;
    }

    renderMessage() {
      var msg: JSX.Element;
      if (this.state.showBusy) {
        msg = <span>
          <span className="esper-spinner esper-inline" />{" "}
          Loading &hellip;
        </span>;
      }

      else if (this.state.showError) {
        msg = <span>
          <i className="fa fa-fw fa-warning" />{" "}
          There was an error loading calendar data.
        </span>;
      }

      else {
        // No message state, don't render message
        return <span />;
      }

      // Render message in wrapper
      return <div className="esper-center esper-msg">{msg}</div>;
    }

    /*
      Where fullCalendar gets initially invoked
    */
    componentDidMount() {
      // this.setSources([
      //   ApiC.postCalendar.store
      // ]);

      $(React.findDOMNode(this._fcDiv)).fullCalendar({
        header: {
          left: 'today prev,next',
          center: 'title',
          right: 'agendaDay,agendaWeek,month'
        },
        defaultView: 'agendaWeek',
        snapDuration: "00:15:00",
        events: this.fetchEvents.bind(this)
      });
    }

    fetchEvents(momentStart: moment.Moment, momentEnd: moment.Moment,
                tz: string|boolean,
                callback: (events: FullCalendar.EventObject[]) => void): void
    {
      momentStart.subtract(1, 'day'); // To get full range regardless of tz
      momentEnd.add(1, 'day'); // Ditto

      var apiDone = false;
      ApiC.postCalendar(this.props.teamId, this.props.calId, {
        window_start: XDate.toString(momentStart.toDate()),
        window_end: XDate.toString(momentEnd.toDate())
      }).done((result) => {
        this.setState({showBusy: false, showError: false});
        callback(_.map(result.events, (event): FullCalendar.EventObject => {
          return {
            id: event.google_event_id,
            title: event.title || "",
            allDay: event.all_day,
            start: this.adjustTz(event.start.local),
            end: this.adjustTz(event.end.local),
            editable: false
          };
        }));
      }).fail(() => {
        this.setState({showBusy: false, showError: true});
      }).always(() => {
        apiDone = true;
      })

      // Promise will return synchronously if already complete and update
      // state accordingly -- so only update to busy and avoid React re-render
      // if API call hasn't compelted yet
      if (! apiDone) {
        this.setState({showBusy: true, showError: false});
      }
    }

    // Adjust a timetamp based on the currently selected calendar's timezone
    // NB: We use the "local" value because the UTC value incorrectly handles
    // things like Timezones
    adjustTz(timestamp: string) {
      var calendar = Calendars.get(this.props.teamId, this.props.calId);
      return moment.tz(timestamp, calendar.calendar_timezone).toDate()
    }
  }
}
