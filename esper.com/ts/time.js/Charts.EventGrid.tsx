/// <reference path="./Charts.CalendarGrid.tsx" />
/// <reference path="./Colors.ts" />

module Esper.Charts {

  const SECONDS_PER_ROW = 8 * 60 * 60; // 3 rows per day

  type Intensity = "zero"|"low"|"med"|"high"|"very-high";

  // Thresholds for determining "intensity"
  const MED_DURATION       = 4  * 60 * 60;
  const HIGH_DURATION      = 8  * 60 * 60;
  const VERY_HIGH_DURATION = 12 * 60 * 60;

  const MED_EVENTS         = 3;
  const HIGH_EVENTS        = 6;
  const VERY_HIGH_EVENTS   = 9;

  /*
    Grid that shows fragmentation, meeting count, and meeting durations
  */
  export class EventGrid extends CalendarGridChart {
    protected dayFn(m: moment.Moment) {
      var data = _.find(this.eventsForDates, (d) =>
        moment(d.date).startOf('day').diff(m.clone().startOf('day')) === 0
      );
      if (! data) return <span />;

      var totalDuration = _.sumBy(data.durations, (d) => d.adjustedDuration);
      var hours = EventStats.toHours(totalDuration);
      var durationIntensity = ((duration: number): Intensity => {
        if (duration > VERY_HIGH_DURATION) {
          return "very-high";
        } else if (duration > HIGH_DURATION) {
          return "high";
        } else if (duration > MED_DURATION) {
          return "med";
        } else if (duration > 0) {
          return "low";
        }
        return "zero";
      })(totalDuration);

      var numEvents = data.durations.length;
      var eventIntensity = ((events: number): Intensity => {
        if (events > VERY_HIGH_EVENTS) {
          return "very-high";
        } else if (events > HIGH_EVENTS) {
          return "high";
        } else if (events > MED_EVENTS) {
          return "med";
        } else if (events > 0) {
          return "low";
        }
        return "zero";
      })(numEvents);

      return <div>
        <div className="metrics-list">
          <Metric className="hours-metric" intensity={durationIntensity}
                  num={hours} unit={Text.hoursUnit(hours)} unitAbbrev="h" />
          <Metric className="count-metric" intensity={eventIntensity}
                  num={numEvents} unit={Text.eventsUnit(numEvents)} />
        </div>
        { this.renderBlocks(data.date, data.durations) }
      </div>
    }

    renderBlocks(date: Date, durations: EventStats.HasDurations[]) {
      var lastEnd = moment(date).startOf('day').unix();
      var blocks: {
        seconds: number;
        event?: Events2.TeamEvent; // No event => open time
      }[] = []
      _.each(durations, (duration) => {
        var startSeconds = moment(duration.event.start).unix();
        if (startSeconds > lastEnd) {
          blocks.push({
            seconds: startSeconds - lastEnd
          });
        }
        var endSeconds = moment(duration.event.end).unix();
        if (endSeconds > lastEnd) {
          lastEnd = endSeconds;
        }
        blocks.push({
          seconds: duration.adjustedDuration,
          event: duration.event
        });
      });

      var endOfDay = moment(date).endOf('day').unix();
      if (lastEnd < endOfDay) {
        blocks.push({
          seconds: endOfDay - lastEnd
        });
      }

      var rowIndex = 0;
      var rowFilled = 0;
      var blockElms = _.map(blocks, (b, i) => {
        var secondsToAllocate = b.seconds;
        var segments: JSX.Element[] = [];
        var rowIndexAtStart = rowIndex;
        var j = 0;
        while (secondsToAllocate > 0) {
          let nextBlock = Math.min(SECONDS_PER_ROW - rowFilled,
                                   secondsToAllocate);
          secondsToAllocate -= nextBlock;
          rowFilled += nextBlock
          var width = (nextBlock / SECONDS_PER_ROW) * 100;
          let style = { width: width + "%" };
          var classNames = ["time-segment"];
          if (b.event) {
            classNames.push("active");
          }
          segments.push(<span key={j++}
            className={classNames.join(" ")}
            style={style}
          >
            <span className={"row-" + rowIndex} />
          </span>); // Inner span for animation purposes
          if (rowFilled >= SECONDS_PER_ROW) {
            rowFilled = 0;
            rowIndex += 1;
          }
        }
        return <TimeBlock key={i.toString()} event={b.event}
                          seconds={b.seconds}>
          { segments }
        </TimeBlock>
      });

      return <div className="time-blocks-container">
        { blockElms }
      </div>;
    }
  }

  class TimeBlock extends ReactHelpers.Component<{
    seconds: number;
    event?: Events2.TeamEvent;
    children?: JSX.Element[];
  }, {}> {

    _block: HTMLSpanElement;

    render() {
      var tooltip = "";

      // NB: Disable tooltip for unscheduled for now
      if (this.props.event) {
        tooltip += this.props.event.title + " @ ";
        tooltip += Text.time(this.props.event.start) + " / ";
        tooltip += Text.hours(EventStats.toHours(this.props.seconds))
      }

      return <span className="time-block" ref={(c) => this._block = c }
                   onClick={() => this.onEventClick()}
                   data-toggle={ tooltip ? "tooltip" : null }
                   title={tooltip}>
        { this.props.children }
      </span>;
    }

    onEventClick() {
      Layout.renderModal(Containers.eventEditorModal([this.props.event]));
      return false;
    }

    componentDidMount() {
      $(this._block).tooltip();
    }

    componentDidUpdate() {
      $(this._block).tooltip();
    }
  }

  class Metric extends ReactHelpers.Component<{
    num: number;
    unit: string;
    intensity?: Intensity;
    className?: string;
    unitAbbrev?: string;
    roundTo?: number;
  }, {}> {

    _block: HTMLSpanElement;

    render() {
      var numStr = Util.roundStr(this.props.num,
        Util.some(this.props.roundTo, 1)
      );
      var classNames = ["metric", this.props.className];
      if (this.props.intensity) {
        classNames.push(this.props.intensity + "-intensity");
      }
      return <span ref={(c) => this._block = c }
              className={classNames.join(" ")}
              data-toggle="tooltip" title={numStr + " " + this.props.unit}>
        <span className="number">
          { numStr }
        </span>
        <span className="unit-abbrev">
          { this.props.unitAbbrev }
        </span>
      </span>;
    }

    componentDidMount() {
      $(this._block).tooltip();
    }

    componentDidUpdate() {
      $(this._block).tooltip();
    }
  }
}
