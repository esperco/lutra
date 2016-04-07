/*
  Component for a FullCalendar rendering

  Consider removing FullCalendar and just using straight up React at some
  point (this would also have the nice effect of shrinking our vendor bundle).
  https://github.com/intljusticemission/react-big-calendar is a good candidate
  for this. Or just using the existing CalendarGrid component and something
  else for week / agenda view.
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Events2.ts" />
/// <reference path="./Calendars.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface CalendarProps {
    period: Period.Single;
    events: Events2.TeamEvent[];
    selectedEvents: Events2.TeamEvent[];
    onEventClick: (event: Events2.TeamEvent, add: boolean) => void;
    onViewChange: (period: Period.Single) => void;
    busy?: boolean;
    error?: boolean;
  }

  export abstract class Calendar extends Component<CalendarProps, {}>
  {
    _fcDiv: HTMLElement;

    constructor(props: CalendarProps) {
      super(props);
    }

    render() {
      return <div className="fullcalendar-holder">
        <div ref={(c) => this._fcDiv = c}></div>
        {this.renderMessage()}
      </div>;
    }

    renderMessage() {
      var msg: JSX.Element;
      if (this.props.busy) {
        msg = <span>
          <span className="esper-spinner esper-inline" />{" "}
          Loading &hellip;
        </span>;
      }

      else if (this.props.error) {
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

    // Performance fix => only check events for change is not busy or error
    shouldComponentUpdate(nextProps: CalendarProps) {
      if (nextProps.busy || nextProps.error) {
        return this.props.busy !== nextProps.busy ||
               this.props.error !== nextProps.error;
      }
      return true;
    }

    /*
      Where fullCalendar gets initially invoked
    */
    componentDidMount() {
      var fcDiv = $(this._fcDiv);
      fcDiv.fullCalendar({
        header: {
          left: 'today prev,next',
          center: 'title',
          right: 'agendaWeek,month'
        },
        defaultView: (() => {
          switch (this.props.period.interval) {
            case "week":
              return 'agendaWeek';
            default:
              return 'month';
          }
        })(),
        defaultDate: Period.boundsFromPeriod(this.props.period)[0],
        events: this.getEvents.bind(this),
        viewRender: this.onViewChange.bind(this),
        eventClick: this.toggleEvent.bind(this),
        height: fcDiv.parent().height() - 10,
        windowResize: () => {
          fcDiv.fullCalendar('option', 'height', fcDiv.parent().height() - 10);
        }
      });
      this.insertRefreshButton();
    }

    /*
      Inserts a refresh button using jQuery -- ideally we'd prefer for React to
      do this for us, but that's hard to make work with FullCalendar
    */
    insertRefreshButton() {
      var btnId = "esper-fc-refresh";
      var fcDiv = $(this._fcDiv);
      var container = fcDiv.find(".fc-right");

      // Sanity check
      if (!container || !container.length) {
        Log.e("Unable to locate FC container for refresh button");
        return;
      }

      // Only insert if refresh button is already there
      if (!container.find("#" + btnId).length) {
        var btn = $("<button type=\"button\" />");
        btn.append($("<i class=\"fa fa-fw fa-refresh\" />"));
        btn.addClass("fc-button fc-state-default");
        btn.addClass("fc-corner-left fc-corner-right");
        btn.attr("id", btnId);
        btn.click(() => {
          Events2.invalidate();
          Route.nav.refreshOnce();
        });
        container.prepend(btn);
      }
    }

    componentDidUpdate() {
      if (!this.props.busy && !this.props.error) {
        $(this._fcDiv).fullCalendar('gotoDate',
          Period.boundsFromPeriod(this.props.period)[0]
        );
        $(this._fcDiv).fullCalendar('refetchEvents');
      }
    }

    // Update URL to reflect current FC view
    onViewChange(view: FullCalendar.ViewObject) {
      var interval = ((name: string): Period.Interval => {
        switch(name) {
          case "agendaWeek":
            return "week";
          default:
            return "month";
        }
      })(view.name);

      // Advance by one day to correct for timezone issues
      var startDate = moment(view.intervalStart)
        .clone().add(1, 'day').toDate();
      var p = Period.singleFromDate(interval, startDate);
      if (! _.isEqual(p, this.props.period)) {
        this.props.onViewChange(p);
      }
    }

    // Format events for FullCalendar
    getEvents(mStart: moment.Moment, mEnd: moment.Moment, tz: string|boolean,
              callback: (events: FullCalendar.EventObject[]) => void): void
    {
      var selectedEventIds = _.map(this.props.selectedEvents, (e) => e.id);

      // For inferring which events are "selected" by virtue of being a
      // recurring event
      var recurringEventIds = _.map(this.props.selectedEvents,
        (e) => e && e.recurring_event_id
      );
      recurringEventIds = _.uniq(_.filter(recurringEventIds));

      callback(_.map(this.props.events, (event, i) => {
        var classNames: string[] = ["selectable"];
        if (_.includes(selectedEventIds, event.id)) {
          classNames.push("active");
        }
        if (_.includes(recurringEventIds, event.recurring_event_id)) {
          classNames.push("recurring-active");
        }
        if (event.recurring_event_id) {
          classNames.push("recurring");
        }
        if (event.labels && event.labels.length) {
          classNames.push("labeled");
        }

        var ret: FullCalendar.EventObject = {
          id: i,
          title: event.title || "",
          allDay: event.all_day,
          start: this.adjustTz(event.start, event.timezone),
          end: this.adjustTz(event.end, event.timezone),
          editable: false,
          className: classNames.join(" ")
        };

        if (event.labels_norm && event.labels_norm.length) {
          ret.color = Colors.getColorForLabel(
            event.labels_norm.length > 1 ?
            Labels.MULTI_LABEL_ID :
            event.labels_norm[0]
          );
        }

        return ret;
      }));
    }

    // Adjust a timetamp based on the currently selected event's timezone
    adjustTz(timestamp: string, timezone?: string) {
      if (timezone) {
        return moment.tz(timestamp, timezone);
      } else {
        return moment(timestamp);
      }
    }

    // Handle event selection, toggle
    toggleEvent(fcEvent: FullCalendar.EventObject, jsEvent: MouseEvent) {
      var index: number = fcEvent.id;
      var event = this.props.events[index];
      if (event) {
        this.props.onEventClick(event, jsEvent.shiftKey || jsEvent.ctrlKey);
      } else {
        Log.e("Unable to find event with index " + index + " in props");
      }
    }
  }
}
