/*
  Component for a FullCalendar rendering

  Consider removing FullCalendar and just using straight up React at some
  point (this would also have the nice effect of shrinking our vendor bundle).
  https://github.com/intljusticemission/react-big-calendar is a good candidate
  for this. Or just using the existing CalendarGrid component and something
  else for week / agenda view.
*/

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface CalendarProps {
    period: Period.Single;
    events: Stores.Events.TeamEvent[];
    selectedEvents: Stores.Events.TeamEvent[];
    onEventClick: (event: Stores.Events.TeamEvent, add: boolean) => void;
    onViewChange: (period: Period.Single) => void;
    busy?: boolean;
    error?: boolean;
  }

  // So we can stick additional stuff in event object
  interface EventObjectPlus extends FullCalendar.EventObject {
    tooltip?: string;
  }

  function asEOPlus(e: FullCalendar.EventObject): EventObjectPlus {
    return e as EventObjectPlus;
  }


  export abstract class Calendar extends Component<CalendarProps, {}>
  {
    _fcDiv: HTMLElement;

    // Capture scroll position so we can reset properly after fetching
    // Work around https://github.com/fullcalendar/fullcalendar/issues/3153
    _scrollTop: number;

    constructor(props: CalendarProps) {
      super(props);
    }

    render() {
      return <div className="fullcalendar-holder esper-expanded padded">
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
        eventRender: (event, element) => {
          var eventPlus = asEOPlus(event);
          if (eventPlus.tooltip) {
            $(element).tooltip({
              title: eventPlus.tooltip
            });
          }
        },
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
          Stores.Events.invalidate();
          Route.nav.refreshOnce();
        });
        container.prepend(btn);
      }
    }

    componentDidUpdate(prevProps: CalendarProps) {
      if (!this.props.busy && !this.props.error) {
        // Capture scroll position before it's lost during refetch
        // Work around https://github.com/fullcalendar/fullcalendar/issues/3153
        this._scrollTop = this.find('.fc-scroller').scrollTop();

        if (prevProps.period &&
            ! _.isEqual(this.props.period, prevProps.period))
        {
          $(this._fcDiv).fullCalendar('gotoDate',
            Period.boundsFromPeriod(this.props.period)[0]
          );
        }
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
        (e) => e && e.recurringEventId
      );
      recurringEventIds = _.uniq(_.filter(recurringEventIds));

      callback(_.map(this.props.events, (event, i) => {
        var classNames: string[] = ["selectable"];
        if (_.includes(selectedEventIds, event.id)) {
          classNames.push("active");
        }
        if (_.includes(recurringEventIds, event.recurringEventId)) {
          classNames.push("recurring-active");
        }
        if (event.recurringEventId) {
          classNames.push("recurring");
        }
        if (event.labels && event.labels.length) {
          classNames.push("labeled");
        }
        if (event.feedback.attended === false) {
          classNames.push("no-attend")
        }

        var ret: EventObjectPlus = {
          id: i,
          title: (event.title || Text.NoEventTitle),
          allDay: event.allDay,
          start: this.adjustTz(event.start, event.timezone),
          end: this.adjustTz(event.end, event.timezone),
          editable: false,
          className: classNames.join(" ")
        };

        var labels = Stores.Events.getLabels(event);
        if (Util.notEmpty(labels)) {
          var label = labels[0];
          ret.color = Colors.getColorForLabel(label.id);
          ret.textColor = Colors.colorForText(ret.color);
          ret.tooltip = label.displayAs;
        }

        return ret;
      }));

      // Fix scroll position after callback -- looks like
      if (this._scrollTop) {
        $('.fc-scroller').scrollTop(this._scrollTop);
      }
    }

    // Adjust a timetamp based on the currently selected event's timezone
    adjustTz(date: Date, timezone?: string) {
      if (timezone) {
        return moment.tz(date, timezone);
      } else {
        return moment(date);
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
