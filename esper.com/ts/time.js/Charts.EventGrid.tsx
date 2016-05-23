/// <reference path="./Charts.CalendarGrid.tsx" />

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

  interface HasLabel extends EventStats.HasDurations {
    label: Option.T<string>;
  }

  /*
    Grid that shows fragmentation, meeting count, and meeting durations
  */
  export class EventGrid extends CalendarGridChart {
    protected allowUnlabeled = true;

    protected dayFn(date: Date) {
      var m = moment(date);
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

    renderBlocks(date: Date, durations: HasLabel[]) {
      var lastEnd = moment(date).startOf('day').unix();
      var blocks: {
        seconds: number;
        event: Option.T<Stores.Events.TeamEvent>; // No event => open time
        label: Option.T<string>;
      }[] = []
      _.each(durations, (duration) => {
        var startSeconds = moment(duration.event.start).unix();
        if (startSeconds > lastEnd) {
          blocks.push({
            seconds: startSeconds - lastEnd,
            event: Option.none<Stores.Events.TeamEvent>(),
            label: Option.none<string>()
          });
        }
        var endSeconds = moment(duration.event.end).unix();
        if (endSeconds > lastEnd) {
          lastEnd = endSeconds;
        }
        blocks.push({
          seconds: duration.adjustedDuration,
          event: Option.some(duration.event),
          label: duration.label
        });
      });

      var endOfDay = moment(date).endOf('day').unix();
      if (lastEnd < endOfDay) {
        blocks.push({
          seconds: endOfDay - lastEnd,
          event: Option.none<Stores.Events.TeamEvent>(),
          label: Option.none<string>()
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
          let style: { background?: string } = {};
          var classNames = ["time-segment"];
          b.event.match({
            none: () => null,
            some: () => {
              classNames.push("active");
              style.background = b.label.match({
                none: () => Colors.lightGray,
                some: (l) => Colors.getColorForLabel(l)
              });
            }
          });
          segments.push(<span key={j++}
            className={classNames.join(" ")}
            style={{width: width + "%"}}
          >
            <span className={"row-" + rowIndex} style={style} />
          </span>); // Inner span for animation purposes
          if (rowFilled >= SECONDS_PER_ROW) {
            rowFilled = 0;
            rowIndex += 1;
          }
        }
        return <TimeBlock key={i.toString()} event={b.event}
                          seconds={b.seconds}
                          label={ b.label.flatMap(
                            (l) => Option.wrap(Labels.getDisplayAs(l))
                          )}>
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
    event: Option.T<Stores.Events.TeamEvent>;
    label: Option.T<string>;
    children?: JSX.Element[];
  }, {}> {

    _block: HTMLSpanElement;

    render() {
      // NB: Disable tooltip for unscheduled for now
      var tooltip = this.props.event.match({
        none: () => "",
        some: (event) => {
          var ret = "";
          ret += (event.title || Text.NoEventTitle) + " @ ";
          ret += Text.time(event.start) + " / ";
          ret += Text.hours(EventStats.toHours(this.props.seconds));
          ret += this.props.label.match({
            none: () => "",
            some: (l) => " (" + l + ")"
          });
          return ret;
        }
      })

      return <span className="time-block" ref={(c) => this._block = c }
                   onClick={() => this.onEventClick()}
                   data-toggle={ tooltip ? "tooltip" : null }
                   title={tooltip} data-original-title={tooltip}>
        { this.props.children }
      </span>;
    }

    onEventClick() {
      this.props.event.match({
        none: () => null,
        some: (event) => {
          Actions.EventLabels.confirm([event]);
          Layout.renderModal(
            Containers.eventEditorModal([event])
          );
        }
      });
      return false;
    }

    componentDidMount() {
      this.mountTooltip();
    }

    componentDidUpdate() {
      this.mountTooltip();
    }

    mountTooltip() {
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
