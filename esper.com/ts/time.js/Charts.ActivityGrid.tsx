/// <reference path="./Charts.CalendarGrid.tsx" />
/// <reference path="./Colors.ts" />

module Esper.Charts {

  /*
    These are used to set a base line for the maximum number of events
    or duration per day. These are raised if actual data from calendar
    indicates this is a busier-than-average person.
  */
  const MAX_TIME_PER_DAY = 8 * 60 * 60;
  const MAX_MEETINGS_PER_DAY = 8;

  /*
    Grid that shows fragmentation, meeting count, and meeting durations
  */
  export class ActivityGrid extends CalendarGridChart {
    static displayName = "Activity Grid";

    // These vars get set by renderChart
    private longestTime: number;
    private highestCount: number;

    // Use super function but initialize some totals first
    renderChart() {
      var data = this.sync()[0];
      var stats = data.daily_stats;

      // Use consts as a base line and bump up if data warrants it
      this.longestTime = MAX_TIME_PER_DAY;
      this.highestCount = MAX_MEETINGS_PER_DAY;
      _.each(stats, (s) => {
        this.longestTime = Math.max(_.sum(s.scheduled), this.longestTime);
        this.highestCount = Math.max(s.scheduled.length, this.highestCount);
      });

      return super.renderChart();
    }

    protected dayFn(m: moment.Moment) {
      var data = this.sync()[0];
      var stats = data.daily_stats[m.date() - 1];
      if (stats && stats.scheduled.length) {

        // Count calc
        var count = stats.scheduled.length / this.highestCount;
        var countBg = Colors.lighten(Colors.yellow, 1-count);
        var countStyle = {
          background: countBg,
          color: Colors.colorForText(countBg)
        };

        // Duration calc
        var hours = _.sum(stats.scheduled) / this.longestTime;
        var hoursBg = Colors.lighten(Colors.orange, 1-hours);
        var hoursStyle = {
          background: hoursBg,
          color: Colors.colorForText(hoursBg)
        };

        // Fragmentation Calc
        var frag = (stats.chunks.length - 1) / stats.scheduled.length;
        if (frag < 0) { frag = 0; }
        var fragBg = Colors.lighten(Colors.red, 1-frag);
        var fragStyle = {
          background: fragBg,
          color: Colors.colorForText(fragBg)
        };

        return <div>
          <div className="event-count daily-metric" style={countStyle}>
            <span><i className="fa fa-fw fa-calendar-o" />{" "}
            {stats.scheduled.length}{" "}Events</span>
          </div>
          <div className="event-duration daily-metric" style={hoursStyle}>
            <span><i className="fa fa-fw fa-clock-o" />{" "}
            {TimeStats.toHours(_.sum(stats.scheduled))}{" "}Hours</span>
          </div>
          <div className="event-frag daily-metric" style={fragStyle}>
            <span><i className="fa fa-fw fa-qrcode" />{" "}
            {(frag * 100).toFixed(0)}% Fragmentation</span>
          </div>
        </div>;
      }
    }
  }
}
