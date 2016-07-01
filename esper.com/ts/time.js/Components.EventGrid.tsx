/*
  Event grid calendar / "chart"
*/

/// <reference path="./Components.CalendarGrid.tsx" />

module Esper.Components {
  const SECONDS_PER_ROW = 12 * 60 * 60; // 2 rows per day

  type Intensity = "zero"|"low"|"med"|"high"|"very-high";

  // Thresholds for determining "intensity"
  const MED_DURATION       = 4  * 60 * 60;
  const HIGH_DURATION      = 8  * 60 * 60;
  const VERY_HIGH_DURATION = 12 * 60 * 60;

  const MED_EVENTS         = 3;
  const HIGH_EVENTS        = 6;
  const VERY_HIGH_EVENTS   = 9;

  interface Props {
    calculation: EventStats.CalcBase<EventStats.DateGroup[], any>;
    fetching: boolean;
    error: boolean;
  }

  export abstract class EventGrid<T>
         extends ReactHelpers.Component<Props & T, {}> {

    /*
      Only update if props or underlying events changed. This is a relatively
      expensive check to do but is less annoying than rendering the chart
      multiple times.
    */
    shouldComponentUpdate(newProps: Props & T) {
      if (newProps.fetching !== this.props.fetching ||
          newProps.error !== this.props.error) {
        return true;
      }

      // Else compare calculation
      return !newProps.calculation.eq(this.props.calculation);
    }

    componentDidMount() {
      this.setCalcSources();
    }

    componentDidUpdate() {
      this.setCalcSources();
    }

    setCalcSources() {
      if (this.props.calculation.ready) {
        this.setSources([]);
      } else {
        this.setSources([this.props.calculation]);
      }
    }

    render() {
      if (this.props.error) {
        return this.renderMsg(<span>
          <i className="fa fa-fw fa-warning"></i>{" "}
          { Text.ChartFetchError }
        </span>);
      }

      if (this.props.fetching) {
        return this.renderMsg(<span>
          <span className="esper-spinner esper-inline" />{" "}
          { Text.ChartFetching }
        </span>);
      }

      return this.props.calculation.getResults().match({
        none: () => this.renderMsg(<span>
          <span className="esper-spinner esper-inline" />{" "}
            { Text.ChartCalculating }
          </span>),

        some: (data) => _.isEmpty(data) ? null :
          <Components.CalendarGrid
            className="calendar-grid-chart"
            date={data[0].date}
            dayFn={ (date) => this.renderDay(date, data) }
          />
      })
    }

    renderMsg(elm: JSX.Element|string) {
      return <div className="esper-expanded esper-no-content">
        <div className="panel-body">
          {elm}
        </div>
      </div>;
    }

    renderDay(date: Date, data: EventStats.DateGroup[]) {
      var group = _.find(data,
        (d) => d.date.getTime() === date.getTime()
      ) || ({
        date: date,
        totalUnique: 0,
        totalValue: 0,
        annotations: [],
        eventMap: {}
      } as EventStats.DateGroup);


      var m = moment(date).startOf('day');
      var totalDuration = group.totalValue;
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

      var numEvents = group.totalUnique;
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
        { this.renderBlocks(date, group.annotations) }
      </div>
    }

    renderBlocks(date: Date, annotations: EventStats.Annotation[]) {
      var lastEnd = moment(date).startOf('day').unix();
      var blocks: {
        seconds: number;
        event: Option.T<Stores.Events.TeamEvent>; // No event => open time
        groups: string[];
      }[] = []
      _.each(annotations, (a) => {
        var startSeconds = moment(a.event.start).unix();
        if (startSeconds > lastEnd) {
          blocks.push({
            seconds: startSeconds - lastEnd,
            event: Option.none<Stores.Events.TeamEvent>(),
            groups: []
          });
        }

        var endSeconds = moment(a.event.end).unix();
        if (endSeconds > lastEnd) {
          lastEnd = endSeconds;
        }

        blocks.push({
          seconds: a.value,
          event: Option.some(a.event),
          groups: a.groups
        });
      });

      var endOfDay = moment(date).endOf('day').unix();
      if (lastEnd < endOfDay) {
        blocks.push({
          seconds: endOfDay - lastEnd,
          event: Option.none<Stores.Events.TeamEvent>(),
          groups: []
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
              style.background = this.colorFn(
                b.event.flatMap(() => Option.some(b.groups))
              );
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
                          category={ this.categoryFn(
                            b.event.flatMap(() => Option.some(b.groups))
                          )}>
          { segments }
        </TimeBlock>
      });

      return <div className="time-blocks-container">
        { blockElms }
      </div>;
    }

    abstract colorFn(groups: Option.T<string[]>): string;

    abstract categoryFn(groups: Option.T<string[]>): string;
  }

  class TimeBlock extends ReactHelpers.Component<{
    seconds: number;
    event: Option.T<Stores.Events.TeamEvent>;
    category: string;
    children?: JSX.Element[];
  }, {}> {
    render() {
      // NB: Disable tooltip for unscheduled for now
      var title = this.props.event.match({
        none: () => "",
        some: (event) => {
          var ret = "";
          ret += (event.title || Text.NoEventTitle) + " @ ";
          ret += Text.time(event.start) + " / ";
          ret += Text.hours(EventStats.toHours(this.props.seconds));
          ret += this.props.category ? ` (${this.props.category})` : "";
          return ret;
        }
      })

      return <Tooltip className="time-block"
                      title={title}
                      onClick={() => this.onEventClick()}>
        { this.props.children }
      </Tooltip>;
    }

    onEventClick() {
      this.props.event.match({
        none: () => null,
        some: (event) => {
          Charting.onEventClick(event);
        }
      });
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
    render() {
      var numStr = Util.roundStr(this.props.num,
        Util.some(this.props.roundTo, 1)
      );
      var classNames = ["metric", this.props.className];
      if (this.props.intensity) {
        classNames.push(this.props.intensity + "-intensity");
      }
      return <Tooltip className={classNames.join(" ")}
                      title={numStr + " " + this.props.unit}>
        <span className="number">
          { numStr }
        </span>
        <span className="unit-abbrev">
          { this.props.unitAbbrev }
        </span>
      </Tooltip>;
    }
  }
}
