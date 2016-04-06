/*
  Pie chart for showing guests by domain
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Charts.GuestChart.tsx" />
/// <reference path="./Components.Highchart.tsx" />
/// <reference path="./Colors.ts" />

module Esper.Charts {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  type EmailsGrouping = GroupsByPeriod<{
    emails: string[];
  }>[];

  export class TopGuests extends GuestChart {
    protected durationsByEmail: EmailsGrouping;
    protected sortedEmails: string[];

    allowedIncrs() {
      return [-1, 1];
    }

    sync() {
      super.sync();
      this.durationsByEmail = this.getGroupsByPeriod(

        // Filter + wrapping function
        (e) => Params.applyListSelectJSON(
          Events2.getGuestDomains(e),
          this.params.filterParams.domains
        ).flatMap((domains) => Option.some({
          event: e,
          domains: domains,
          emails: Events2.getGuestEmails(e, domains)
        })),

        // Group by labels
        (w) => w.emails
      );
      this.sortedEmails = this.sortByForCurrentPeriod(
        this.durationsByEmail, (w) => -w.duration
      );
    }

    onEventClick(event: Events2.TeamEvent) {
      Layout.renderModal(Containers.eventEditorModal([event]));
      return false;
    }

    renderChart() {
      var categories = this.sortedEmails;
      var durations = this.durationsByEmail;
      var series: {
        name: string,
        cursor: string,
        color: string,
        stack: string,
        index: number,
        data: HighchartsDataPoint[]
      }[] = [];

      _.each(durations, (d) =>
        _.each(d.groups.some, (s) => {
          let email = s.key;
          let domain = email.split('@')[1] || "";
          var color = _.isEqual(d.period, this.params.period) ?
            Colors.getColorForDomain(domain) : Colors.lightGray;
          series.push({
            name: email,
            cursor: "pointer",
            color: color,
            stack: Text.fmtPeriod(d.period),
            index: Period.asNumber(d.period),
            data: _.map(s.items, (wrapper) => ({
              name: Text.eventTitleForChart(wrapper.event),
              x: _.indexOf(categories, email),
              y: EventStats.toHours(wrapper.duration),
              events: {
                click: () => this.onEventClick(wrapper.event)
              }
            }) as HighchartsDataPoint)
          })
        })
      );

      return <Components.Highchart opts={{
        chart: {
          type: 'bar',
          height: categories.length * 50 + 120
        },

        tooltip: eventPointTooltip,

        legend: {
          enabled: false
        },

        plotOptions: {
          bar: {
            borderWidth: 1,
            stacking: 'normal'
          }
        },

        xAxis: {
          categories: categories
        },

        yAxis: [{
          title: { text: "Duration (Hours)" }
        }],

        series: series
      }} />;
    }
  }
}
