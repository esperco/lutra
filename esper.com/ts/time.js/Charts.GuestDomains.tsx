/*
  Pie chart for showing guests by domain
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Charts.AutoChart.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./DailyStats.ts" />
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

  export class GuestDomains extends AutoChart {
    static displayName = "Guest Domains";
    static usesIntervals = false;

    renderChart() {
      var data = this.sync()[0];
      var domains = DailyStats.topGuestDomains(data);

      // Some math and filtering with totals
      var totalScheduled = DailyStats.sumScheduled(data);
      var totalWithGuests = DailyStats.sumWithGuests(data);
      var totalNoGuests = totalScheduled - totalWithGuests;

      var totalDomain = _.sum(domains, (d) => d.time);
      var cutOffTime = TOP_GUESTS_CUT_OFF * totalDomain;
      domains = _.filter(domains, (d) => d.time >= cutOffTime);

      var totalNamedDomain = _.sum(domains, (d) => d.time)
      var totalUnnamedDomain = totalDomain - totalNamedDomain;

      /////

      var addressData: HighchartsDataPoint[] = [];
      var domainData: HighchartsDataPoint[] = _.map(domains,
        (d) => {
          // Filter from largest to smallest
          var domainGuests = _.filter(d.guests,
            (g) => g.time >= cutOffTime
          );

          // Each guest is colored a shade of base color for domain
          var baseColor = Colors.getColorForDomain(d.domain);
          var totalGuests = domainGuests.length;
          _.each(domainGuests, (g, i) => {
            addressData.push({
              name: g.name ? `${g.name} (${g.email})` : g.email,
              color: Colors.lighten(baseColor,
                ((totalGuests - i) / totalGuests) * MAX_COLOR_CHANGE),
              y: TimeStats.toHours(g.time)
            });
          });

          // Guests less than cutoff get labeled as "Other"
          var remainder = d.time - _.sum(domainGuests, (g) => g.time);
          if (remainder && remainder > 0) {
            addressData.push({
              name: "Other " + d.domain,
              color: baseColor,
              y: TimeStats.toHours(remainder)
            });
          }

          return {
            name: d.domain,
            color: baseColor,
            y: TimeStats.toHours(d.time)
          }
        });

        // Add "no guests"
        if (totalNoGuests > 0) {
          let color = Colors.lightGray;
          let hours = TimeStats.toHours(totalNoGuests);
          addressData.unshift({
            name: "No Guests",
            color: color,
            y: hours
          });

          domainData.unshift({
            name: "No Guests",
            color: color,
            y: hours
          });
        }

        // Add "other"
        if (totalUnnamedDomain > 0) {
          var color = Colors.getColorForDomain("");
          var hours = TimeStats.toHours(totalUnnamedDomain);
          addressData.unshift({
            name: "Other",
            color: color,
            y: hours
          });

          domainData.unshift({
            name: "Other",
            color: color,
            y: hours
          });
        }

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
                    `(${this.percentage.toFixed(1)}%)`;
                }
              }
            }
          } as HighchartsPieChartSeriesOptions
        ]
      }} units="Adjusted Hours" />;
    }
  }
}
