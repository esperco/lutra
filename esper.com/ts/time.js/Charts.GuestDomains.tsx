/*
  Pie chart for showing guests by domain
*/

/// <reference path="./Charts.Guestchart.tsx" />

module Esper.Charts {
  /*
    Cut-off percentage for what to show in pie chart -- slices less than this
    are grouped into an "other" category
  */
  const TOP_GUESTS_CUT_OFF = 0.01; // 1%

  /*
    Guest colors in pie chart are lightened versions of a base color. This value
    is the maximum percentage to lighten any given slice.
  */
  const MAX_COLOR_CHANGE = 0.7;

  // This is the maximum to lighten any slice relative to the previous one
  const MAX_COLOR_DELTA = 0.3;


  /////

  interface DurationsGroupingMap<T> {
    [index: string]: EventStats.DurationsGrouping<T>;
  }

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class GuestDomains extends GuestChart {
    protected allowEmpty = true;
    protected durationsByDomain: EventStats.DurationsGrouping<{
      domains: string[];
      emails: string[];
    }>;
    protected emailDurationsByDomain: DurationsGroupingMap<{
      emails: string[];
    }>;
    totalDuration: number;
    totalCount: number;

    sync() {
      super.sync();
      var bounds = Period.boundsFromPeriod(this.params.period);
      var durations = EventStats.wrapWithDurations(this.events,
        (e) => Params.applyListSelectJSON(
          Stores.Events.getGuestDomains(e),
          this.params.filterParams.domains
        ).flatMap((domains) => Option.some({
          event: e,
          domains: domains,
          emails: Stores.Events.getGuestEmails(e, domains)
        })),
        { truncateStart: bounds[0], truncateEnd: bounds[1] }
      );

      this.totalDuration = _.sumBy(durations, (d) => d.adjustedDuration);
      this.totalCount = durations.length;
      this.durationsByDomain = Partition.groupByMany(durations,
        (e) => _.uniq(e.domains)
      );
      this.durationsByDomain.some = _.sortBy(this.durationsByDomain.some,
        (s) => 0 - _.sumBy(s.items, (i) => i.adjustedDuration)
      );

      // For drilldown
      this.emailDurationsByDomain = {};
      _.each(this.durationsByDomain.some, (s) => {
        var grouping = Partition.groupByMany(s.items,
          (e) => Stores.Events.getGuestEmails(e.event, [s.key])
        );
        grouping.some = _.sortBy(grouping.some,
          (s) => 0 - _.sumBy(s.items, (i) => i.adjustedDuration)
        );
        this.emailDurationsByDomain[s.key] = grouping;
      });
    }

    renderChart() {
      var data = _.map(this.durationsByDomain.some, (d) => ({
        name: d.key,
        drilldown: d.key,
        color: Colors.getColorForDomain(d.key),
        count: d.items.length,
        // hours: EventStats.toHours(_.sumBy(d.items, (i) => i.duration)),
        y: EventStats.toHours(
          _.sumBy(d.items, (i) =>
            Stores.Events.getGuestEmails(i.event, [d.key]).length *
            i.adjustedDuration /
            i.emails.length
          )
        ),
        events: { click: () => true }
      }));

      if (this.durationsByDomain.none.length && this.showEmptyDomain()) {
        data.push({
          name: "No Guests",
          drilldown: null,
          color: Colors.lightGray,
          count: this.durationsByDomain.none.length,
          // hours: EventStats.toHours(
          //   _.sumBy(this.durationsByDomain.none, (i) => i.duration)
          // ),
          y: EventStats.toHours(
            _.sumBy(this.durationsByDomain.none, (i) => i.adjustedDuration)
          ),
          events: {
            click: () => this.onSeriesClick(
              _.map(this.durationsByDomain.none, (w) => w.event)
            )
          }
        })
      }

      var drilldownData = _.map(this.emailDurationsByDomain,
        (grouping, domain) => {
          var baseColor = Colors.getColorForDomain(domain);
          var colorStep = Math.min(
            MAX_COLOR_CHANGE / (grouping.some.length - 1),
            MAX_COLOR_DELTA);
          return {
            name: domain,
            id: domain,
            data: _.map(grouping.some, (s, i) => ({
              name: s.key,
              color: Colors.lighten(baseColor, i * colorStep),
              count: s.items.length,
              // hours: EventStats.toHours(_.sumBy(s.items, (d) => d.duration)),
              y: EventStats.toHours(
                _.sumBy(s.items, (d) => d.adjustedDuration / d.emails.length)
              ),
              events: {
                click: () => this.onSeriesClick(_.map(s.items, (w) => w.event))
              }
            }))
          };
        }
      );

      return <Components.Highchart opts={{
        chart: {
          type: 'pie'
        },

        plotOptions: {
          pie: {
            cursor: 'pointer',
            dataLabels: {
              enabled: true,
              formatter: function() {
                if (this.percentage) {
                  return `${this.point.name} ` +
                    `(${Util.roundStr(this.percentage, 1)}%)`;
                }
              }
            },
            size: '80%'
          }
        },

        tooltip: countPointTooltip,

        drilldown: {
          series: drilldownData
        },

        series: [{
          data: data
        }]
      }} />;
    }
  }
}
