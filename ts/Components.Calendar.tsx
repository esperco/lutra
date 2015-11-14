/*
  Component for a FullCalendar rendering
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Events.ts" />
/// <reference path="./Calendars.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface CalendarProps {
    teamId: string;
    calId: string;
    eventIds?: string[];
    updateFn: (eventId: string, eventTitle: string, add: boolean) => void;
  }

  interface CalendarState {
    showBusy?: boolean;
    showError?: boolean;
  }

  export abstract class Calendar extends Component<CalendarProps, CalendarState>
  {
    _fcDiv: React.Component<any, any>;
    _currentStart: number;  // Unix time
    _currentEnd: number;    // Unix time

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
      var fcDiv = $(React.findDOMNode(this._fcDiv));
      fcDiv.fullCalendar({
        header: {
          left: 'today prev,next',
          center: 'title',
          right: 'agendaDay,agendaWeek,month'
        },
        defaultView: 'agendaWeek',
        snapDuration: "00:15:00",
        events: this.getSync.bind(this),
        viewRender:this.fetchAsync.bind(this),
        eventClick: this.toggleEvent.bind(this),
        height: fcDiv.parent().height() - 10,
        windowResize: () => {
          fcDiv.fullCalendar('option', 'height', fcDiv.parent().height() - 10);
        }
      });

      this.setSources([Events.EventStore]);
    }

    // Return something so setSources works
    getState(props: CalendarProps) {
      return this.state || {};
    }

    componentDidUpdate(prevProps: CalendarProps, prevState: CalendarState) {
      $(React.findDOMNode(this._fcDiv)).fullCalendar('refetchEvents');
    }

    // Offset range to handle timezone weirdness -- doesn't mutate
    getRange(start: moment.Moment, end: moment.Moment) {
      return [
        start.clone().subtract(1, 'day'),
        end.clone().add(1, 'day')
      ];
    }

    // Asynchronusly make calls to update stores
    fetchAsync(view: FullCalendar.View) {
      var range = this.getRange(view.start, view.end);
      var momentStart = range[0];
      var momentEnd = range[1];

      /*
        Remember currrent interval start/stop for callback purposes -- used
        to avoid situation where navigating between multiple views quickly
        causes state to be improperly updated. Use unix time to avoid
        mutation issues.
      */
      var currentStart = this._currentStart = momentStart.unix();
      var currentEnd = this._currentEnd = momentEnd.unix();

      var apiDone = false;
      Events.fetch(this.props.teamId, this.props.calId,
        momentStart.toDate(), momentEnd.toDate()
      ).done(() => {
        // Only update state if we're still looking at the same interval
        if (this._currentStart === currentStart &&
            this._currentEnd === currentEnd) {
          this.setState({showBusy: false, showError: false});
        }
      }).fail(() => {
        this.setState({showBusy: false, showError: true});
      }).always(() => {
        apiDone = true;
      });

      // Promise will return synchronously if already complete and update
      // state accordingly -- so only update to busy and avoid React re-render
      // if API call hasn't compelted yet
      if (! apiDone) {
        this.setState({showBusy: true, showError: false});
      }
    }

    // Synchronously fetch from stores
    getSync(momentStart: moment.Moment, momentEnd: moment.Moment,
            tz: string|boolean,
            callback: (events: FullCalendar.EventObject[]) => void): void
    {
      var range = this.getRange(momentStart, momentEnd);
      momentStart = range[0];
      momentEnd = range[1];

      var events = Events.get(this.props.teamId, this.props.calId,
        momentStart.toDate(), momentEnd.toDate()
      );

      callback(_.map(events, (event): FullCalendar.EventObject => {
        var eventId = Calendars.getEventId(event);
        var classNames: string[] = ["selectable"];
        if (_.contains(this.props.eventIds || [], eventId)) {
          classNames.push("active");
        }
        if (event.labels && event.labels.length) {
          classNames.push("labeled");
        }
        return {
          id: eventId,
          title: event.title || "",
          allDay: event.all_day,
          start: this.adjustTz(event.start.local),
          end: this.adjustTz(event.end.local),
          editable: false,
          className: classNames.join(" ")
        };
      }));
    }

    // Adjust a timetamp based on the currently selected calendar's timezone
    // NB: We use the "local" value because the UTC value incorrectly handles
    // things like Timezones
    adjustTz(timestamp: string) {
      var calendar = Calendars.get(this.props.teamId, this.props.calId);
      return moment.tz(timestamp, calendar.calendar_timezone).toDate()
    }

    // Handle event selection, toggle
    toggleEvent(event: FullCalendar.EventObject, jsEvent: MouseEvent) {
      var currentlySelected = _.contains(this.props.eventIds || [], event.id);
      this.props.updateFn(event.id, event.title, jsEvent.shiftKey);
    }
  }
}
