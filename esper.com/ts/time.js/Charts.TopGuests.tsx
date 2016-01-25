/*
  Bar chart for show label durations over time
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Charts.AutoChart.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./DailyStats.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Colors.ts" />

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

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class TopGuests extends AutoChart {
    static displayName = "Top Guests";
    static usesIntervals = false;

    noData() {
      var pair = this.sync();
      var data = pair && pair[0];
      return !(data.top_guest_domains.length > 0 &&
               data.top_guests.length > 0);
    }

    renderChart() {
      var data = this.sync()[0];
      var totalTime = _.sum(data.top_guest_domains, (d) => d.split_time);
      var cutOffTime = TOP_GUESTS_CUT_OFF * totalTime;

      var addressData: HighchartsDataPoint[] = [];
      var domainData: HighchartsDataPoint[] = _.map(data.top_guest_domains,
        (d) => {
          // For each domain, populate with guests for that domain
          var domainGuests = _.filter(data.top_guests,
            (g) => _.endsWith(g.id, d.id) && g.split_time > cutOffTime
          );
          domainGuests = _.sortBy(domainGuests, (g) => g.split_time);

          var baseColor = Colors.getColorForDomain(d.id);
          var totalGuests = domainGuests.length;
          _.each(domainGuests, (g, i) => {
            addressData.push({
              name: g.name ? `${g.name} <${g.id}>` : g.id,
              color: Colors.lighten(baseColor,
                ((totalGuests - i) / totalGuests) * MAX_COLOR_CHANGE),
              y: TimeStats.toHours(g.split_time)
            });
          });

          var remainder = d.split_time -
            _.sum(domainGuests, (g) => g.split_time);
          if (remainder && remainder > 0) {
            addressData.push({
              name: "Other " + d.id,
              color: baseColor,
              y: TimeStats.toHours(remainder)
            });
          }

          return {
            name: d.id,
            color: baseColor,
            y: TimeStats.toHours(d.split_time)
          }
        });

      return <Components.Highchart opts={{
        chart: {
          type: 'pie'
        },

        series: [
          {
            size: '60%',
            data: domainData,
            dataLabels: {
              enabled: true,
              formatter: function () {
                return this.percentage > 10 ? this.point.name : null;
              },
              color: '#ffffff',
              style: { textShadow: "" },
              backgroundColor: "#000000",
              distance: -30
            }
          } as HighchartsPieChartSeriesOptions,
          {
            size: '80%',
            innerSize: '60%',
            data: addressData,
            dataLabels: {
              enabled: true,
              formatter: function() {
                if (this.percentage) {
                  return `${this.point.name} ` +
                    `(${this.percentage.toFixed(2)}%)`;
                }
              }
            }
          } as HighchartsPieChartSeriesOptions
        ]
      }} units="Adjusted Hours" />;
    }
  }
}
