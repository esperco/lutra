/*
  Pie chart for showing guests by domain
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Charts.Guestchart.tsx" />
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

  // This is the maximum to lighten any slice relative to the previous one
  const MAX_COLOR_DELTA = 0.2;

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class GuestDomains extends GuestChart {
    static displayName = "Guest Domains";
    protected usesIntervals = false;
    protected allowEmpty = true;

    renderChart() {
      var data = this.sync()[0];
      var domains = DailyStats.topGuestDomains(data, this.getSelectedDomains());

      // Some math and filtering with totals
      var totalScheduled = DailyStats.sumScheduled(data);
      var totalWithGuests = DailyStats.sumWithGuests(data);
      var totalNoGuests = totalScheduled - totalWithGuests;

      var totalDomain = _.sumBy(domains, (d) => d.time);
      var totalDisplayed = this.showEmptyDomain() ?
        totalNoGuests + totalDomain : totalDomain;
      var cutOffTime = TOP_GUESTS_CUT_OFF * totalDisplayed;
      domains = _.filter(domains, (d) => d.time >= cutOffTime);

      var totalNamedDomain = _.sumBy(domains, (d) => d.time)
      var totalUnnamedDomain = totalDomain - totalNamedDomain;

      /////

      var addressData: HighchartsDataPoint[] = [];
      var domainData: HighchartsDataPoint[] = _.map(domains,
        (d) => {
          // Filter from largest to smallest
          var domainGuests = _.filter(d.guests,
            (g) => g.time >= cutOffTime
          );
          var remainder = d.time - _.sumBy(domainGuests, (g) => g.time);

          // Each guest is colored a shade of base color for domain
          var baseColor = Colors.getColorForDomain(d.domain);
          var totalGuests = domainGuests.length;
          if (remainder && remainder > 0) {
            totalGuests += 1;
          }
          var colorStep = Math.min(
            MAX_COLOR_CHANGE / (totalGuests - 1),
            MAX_COLOR_DELTA);

          _.each(domainGuests, (g, i) => {
            addressData.push({
              name: g.name ? `${g.name} (${g.email})` : g.email,
              color: Colors.lighten(baseColor, i * colorStep),
              y: TimeStats.toHours(g.time)
            });
          });

          // Guests less than cutoff get labeled as "Other"
          if (remainder && remainder > 0) {
            addressData.push({
              name: "Other " + d.domain,
              color: Colors.lighten(baseColor, totalGuests * colorStep),
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
        if (this.showEmptyDomain() && totalNoGuests > 0) {
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
              color: Colors.black,
              style: { textShadow: "" },
              backgroundColor: Colors.offWhite,
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
