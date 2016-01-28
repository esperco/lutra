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
        startFreeTimes.push(9 * 60 * 60);   // TODO: Fix
        endFreeTimes.push(6 * 60 * 60);     // TODO: Fix
      });

      startFreeTimes.sort();
      endFreeTimes.sort();

      var medianIndex = Math.floor(stats.length / 2);
      this.startFree = Math.min(startFreeTimes[medianIndex], START_FREE);
      this.endFree = Math.min(endFreeTimes[medianIndex], END_FREE);

      return super.renderChart();
    }

    protected dayFn(m: moment.Moment) {
      var data = this.sync()[0];
      var stats = data.daily_stats[m.date() - 1];
      if (stats) {
        // Aim for three rows
        var maxTimePerRow = (24 * 60 * 60 - this.startFree - this.endFree) / 3;

        // TODO: Fix
        var freeChunks: number[] = stats.scheduled.length ? [
          8 * 60 * 60,
          0.5 * 60 * 60,
          0.5 * 60 * 60,
          4 * 60 * 60,
          9 * 60 * 60
        ] : [24 * 60 * 60];
        freeChunks[0] -= this.startFree;
        freeChunks[freeChunks.length - 1] -= this.endFree;

        var spans: JSX.Element[] = [];

        // Track the length of the current row so we can wrap around
        var currentRow = 0;

        _.each(freeChunks, (c, i) => {
          if (c <= 15 * 60) { return; } // Ignore tiny or negative chunks

          var color = Colors.lighten(Colors.green,
            0.9 * (1 - Math.min(c / MAX_FREE, 1)));
          var j = 0;
          while (c > 0) {
            if (currentRow >= maxTimePerRow) { currentRow = 0; }
            var rowLength = Math.min(maxTimePerRow - currentRow, c);
            c -= rowLength;
            currentRow += rowLength;
            j += 1;
            spans.push(
              <span key={i.toString() + " " + j.toString()}
                className="availability-block"
                style={{width: (rowLength * 100 / maxTimePerRow) + "%"}}>
                <span style={{background: color}} />
              </span>);
          }
        });

        console.info(spans.length);

        return <div className="availability-blocks-container">
          { spans }
        </div>;
      }
    }
  }
}
