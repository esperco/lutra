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

  export abstract class Calendar extends Component<CalendarProps, {}>
  {
    _fcDiv: React.Component<any, any>;

    render() {
      return <div className="fullcalendar-holder">
        <div ref={(c) => this._fcDiv = c}></div>
      </div>;
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

      ApiC.postCalendar(this.props.teamId, this.props.calId, {
        window_start: XDate.toString(momentStart.toDate()),
        window_end: XDate.toString(momentEnd.toDate())
      }).done((result) => {
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
      });
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
