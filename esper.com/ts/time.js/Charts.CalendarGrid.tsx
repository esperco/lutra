/// <reference path="./Components.CalendarGrid.tsx" />
/// <reference path="./Esper.ts" />
/// <reference path="./Charts.LabelChart.tsx" />

module Esper.Charts {

  interface HasLabel extends EventStats.HasDurations {
    label: Option.T<string>;
  }

  /*
    Base class for calendar grid-style Autochart
  */
  export abstract class CalendarGridChart extends LabelChart {
    protected eventsForDates: {
      date: Date;
      durations: HasLabel[];
    }[];

    sync() {
      super.sync();

      var bounds = Period.boundsFromPeriod(this.params.period);
      var dates = Events2.datesFromBounds(bounds[0], bounds[1]);
      this.eventsForDates = _.map(dates, (d) => {
        var events: Events2.TeamEvent[] = [];
        _.each(this.params.cals, (cal) => {
          Events2.EventsForDateStore.batchGet({
            teamId: cal.teamId,
            calId: cal.calId,
            date: d
          }).match({
            none: () => null,
            some: (s) => s.data.match({
              none: () => null,
              some: (optList) => _.each(optList, (opt) => opt.data.match({
                none: () => null,
                some: (event) => events.push(event)
              }))
            })
          });
        });

        events = this.filterEvents(events, this.params.filterParams);
        var wrappers = Option.flatten(
          _.map(events, (e) =>
            Params.applyListSelectJSON(
              e.labels_norm,
              this.params.filterParams.labels
            ).flatMap(
              (labels) => Option.some(labels[0])
            ).flatMap((label) => Option.some({
              event: e,
              label: Option.wrap(label)
            }))
          )
        );

        var durations = EventStats.getDurations(wrappers, {
          truncateStart: moment(d).startOf('day').toDate(),
          truncateEnd: moment(d).endOf('day').toDate(),
        });

        return {
          date: d,
          durations: durations
        };
      });
    }

    renderChart() {
      var start = Period.boundsFromPeriod(this.params.period)[0]
      return <Components.CalendarGrid
        className="calendar-grid-chart"
        date={start}
        dayFn={(d) => this.dayFn(d)}
      />;
    }

    noData() {
      return false;
    }

    protected abstract dayFn(m: Date): JSX.Element;

    intervalsAllowed(): Period.Interval[] {
      return ["month"];
    }
  }
}
