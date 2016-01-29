/// <reference path="./Charts.CalendarGrid.tsx" />
/// <reference path="./Colors.ts" />

module Esper.Charts {

  /*
    These are used to set a base line for the start and end of a workday (as
    seconds from starting and ending midnight, respectively). These numbers
    are adjusted downwards (i.e. to expand the "workday" for busy people)
    to reflect the median lengths of the available time starting and ending
    each work day.
  */
  const START_FREE = 9 * 60 * 60;  // 9AM start
  const END_FREE = 6 * 60 * 60;   // 6PM end

  /*
    How much free time warrants a 100% shading. Free time chunks >= this
    will be shaded the same intensity regardless of relative length.
  */
  const MAX_FREE = 6 * 60 * 60;

  /*
    Don't render availability blocks smaller than this (in seconds)
  */
  const BLOCK_CUT_OFF = 30 * 60;

  /*
    Grid that shows fragmentation, meeting count, and meeting durations
  */
  export class WorkHoursGrid extends CalendarGridChart {
    static displayName = "Working Hours Availability";

    // These vars get set by renderChart
    private startFree: number;
    private endFree: number;

    // Use super function but initialize some totals first
    renderChart() {
      var data = this.sync()[0];
      var stats = data.daily_stats;

      // Calculate *median* start availability
      var startFreeTimes: number[] = [];
      var endFreeTimes: number[] = [];

      _.each(stats, (s) => {
        if (s.chunks.length > 1) { // Ignore empty days
          var firstChunk = s.chunks[0];
          if (firstChunk < 0) {
            startFreeTimes.push(-firstChunk);
          }
          var lastChunk = s.chunks[s.chunks.length - 1]
          if (lastChunk < 0) {
            endFreeTimes.push(-lastChunk)
          }
        }
      });

      startFreeTimes.sort();
      endFreeTimes.sort();

      this.startFree = Math.min(
        startFreeTimes[Math.floor(startFreeTimes.length / 2)],
        START_FREE);
      this.endFree = Math.min(
        endFreeTimes[Math.floor(endFreeTimes.length / 2)],
        END_FREE);

      return super.renderChart();
    }

    protected dayFn(m: moment.Moment) {
      var data = this.sync()[0];
      var stats = data.daily_stats[m.date() - 1];
      if (stats) {
        var maxWorkday = 24 * 60 * 60 - this.startFree - this.endFree;

        /*
          Aim for three rows -- this is approximate and doesn't account for
          padding at the edges, so we'll probably get a few four row instances
          if user has a lot of availability.
        */
        var maxTimePerRow = maxWorkday / 3;

        var freeChunks: number[] = _.clone(stats.chunks);
        if (freeChunks.length > 1) {
          if (freeChunks[0] < 0) {
            freeChunks[0] += this.startFree;
          }
          if (freeChunks[freeChunks.length - 1] < 0) {
            freeChunks[freeChunks.length - 1] += this.endFree;
          }
          freeChunks = _.map(
            _.filter(freeChunks, (c) => c < 0),
            (c) => Math.min(-c, maxWorkday)
          );
        } else {
          freeChunks = [maxWorkday];
        }

        return <div className="time-blocks-container">{ _.map(freeChunks,
          (c, i) => <TimeBlock key={i.toString()} seconds={c}
                               secondsPerRow={maxTimePerRow} />
        ) }</div>;
      }
    }
  }

  class TimeBlock extends ReactHelpers.Component<{
    key?: string;
    seconds: number;
    secondsPerRow: number;
  }, {}> {

    _block: HTMLSpanElement;

    render() {
      var shadePct =  Math.min(this.props.seconds / MAX_FREE, 1);
      var color = Colors.shadeBlend(shadePct, Colors.yellow, Colors.green);
      color = Colors.lighten(color, 0.9 * (1 - shadePct));
      var hours = Math.floor(this.props.seconds / (60 * 60));
      var remainder = this.props.seconds % (60 * 60);
      var hoursWidth = ((60 * 60) / this.props.secondsPerRow) * 100;
      var remainderWidth = (remainder / (60 * 60)) * hoursWidth;

      var colorStyle = { background: color };
      var hoursStyle = {
        width: Math.floor(hoursWidth) + "%",
      };
      var remainderStyle = {
        width: Math.floor(remainderWidth) + "%",
      };

      return <span className="time-block" ref={(c) => this._block = c }
                   data-toggle="tooltip"
                   title={TimeStats.toHours(this.props.seconds) + " hours"}>
        {
          _.times(hours, (i) =>
            <span key={i.toString()} className="time-segment"
                  style={hoursStyle}>
              <span style={colorStyle} />
            </span>
          )
        }
        {
          remainder > BLOCK_CUT_OFF ?
          <span key="remainder" className="time-segment"
                style={remainderStyle}>
             <span style={colorStyle} />
          </span> : null
        }
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
