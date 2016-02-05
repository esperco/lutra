/// <reference path="../../../typings/browser.d.ts" />
/// <reference path="../common/Colors.ts" />

module Esper {
  // Highcharts target elm
  var defaultSplash = "#default-splash";
  var chartSplash = "#chart-splash";
  var chartTarget = "#chart-target";

  function showCharts() {
    $(defaultSplash).hide();
    $(chartSplash).show();
  }

  export function drawGuestDomains() {
    showCharts();
    $(chartTarget).highcharts({
      credits: { enabled: false },
      title: { text: "" },
      chart: {
        type: 'pie',
        backgroundColor: 'rgba(255, 255, 255, 0)'
      },

      plotOptions: {
        series: {
          animation: { duration: 500 }
        }
      },

      tooltip: {
        formatter: function() {
          var name = this.point.name || this.series.name;
          return `<b>${name}:</b> ${this.y} Hours` +
            (this.percentage ? ` (${this.percentage.toFixed(1)}%)` : "");
        },
        backgroundColor: {
          linearGradient: {x1: 0, y1: 0.5, x2: 0, y2: 1},
          stops: [
              [0, '#FFFFFF'],
              [1, '#FCFCFC']
          ]
        },
        borderWidth: 0,
        borderRadius: 1
      },

      series: [
        {
          size: '70%',
          data: [
            {name: "stark.com", y: 34.75, color: Colors.presets[0] },
            {name: "os.corp", y: 20, color: Colors.presets[1] },
            {name: "pymtech.com", y: 14, color: Colors.presets[2] },
            {name: "aim.org", y: 10, color: Colors.presets[3] },
            {name: "hammer.com", y: 9.25, color: Colors.presets[4] },
            {name: "shield.gov", y: 8, color: Colors.presets[5] }
            // {name: "us.army.mil", y: 4.5, color: Colors.presets[6] },
            // {name: "us.af.mil", y: 3, color: Colors.presets[7] },
            // {name: "roxxon.com", y: 2.75, color: Colors.presets[8] },
            // {name: "parkertech.com", y: 2, color: Colors.presets[9] },
            // {name: "beyondcorp.com", y: 1.25, color: Colors.presets[10] }
          ],
          dataLabels: {
            enabled: true,
            formatter: function () {
              return this.percentage > 5 ? this.point.name : null;
            },
            color: '#000000',
            style: { textShadow: "" },
            backgroundColor: "#ffffff",
            distance: -10
          }
        } as HighchartsPieChartSeriesOptions,
        {
          size: '100%',
          innerSize: '70%',
          data: [
            { name: "ostane@stark.com", y: 8,
              color: Colors.presets[0] },
            { name: "ppotts@stark.com", y: 5,
              color: Colors.lighten(Colors.presets[0], 0.09) },
            { name: "tony@stark.com", y: 5,
              color: Colors.lighten(Colors.presets[0], 0.18) },
            { name: "hr@stark.com", y: 3.5,
              color: Colors.lighten(Colors.presets[0], 0.27) },
            { name: "legal@stark.com", y: 3.5,
              color: Colors.lighten(Colors.presets[0], 0.36) },
            { name: "pr@stark.com", y: 3,
              color: Colors.lighten(Colors.presets[0], 0.45) },
            { name: "elon@stark.com", y: 1.5,
              color: Colors.lighten(Colors.presets[0], 0.54) },
            { name: "hhogan@stark.com", y: 1.25,
              color: Colors.lighten(Colors.presets[0], 0.63) },
            { name: "Other stark.com", y: 4,
              color: Colors.lighten(Colors.presets[0], 0.7) },

            { name: "norman.osborn@os.corp", y: 10,
              color: Colors.presets[1] },
            { name: "gwen.stacy@os.corp", y: 6,
              color: Colors.lighten(Colors.presets[1], 0.2) },
            { name: "max.dillon@os.corp", y: 1.25,
              color: Colors.lighten(Colors.presets[1], 0.4) },
            { name: "Other os.corp", y: 2.75,
              color: Colors.lighten(Colors.presets[1], 0.6) },

            { name: "cross@pymtech.com", y: 11,
              color: Colors.presets[2] },
            { name: "hope@pymtech.com", y: 1.5,
              color: Colors.lighten(Colors.presets[2], 0.2) },
            { name: "hank@pymtech.com", y: 1.5,
              color: Colors.lighten(Colors.presets[2], 0.4) },

            { name: "killian@aim.org", y: 3.25,
              color: Colors.presets[3] },
            { name: "aforson@aim.org", y: 1.5,
              color: Colors.lighten(Colors.presets[3], 0.2) },
            { name: "fhall@aim.org", y: 1.25,
              color: Colors.lighten(Colors.presets[3], 0.4) },
            { name: "Other aim.org", y: 4,
              color: Colors.lighten(Colors.presets[3], 0.6) },

            { name: "ivanko@hammer.com", y: 5.5,
              color: Colors.presets[4] },
            { name: "justin@hammer.com", y: 3,
              color: Colors.lighten(Colors.presets[4], 0.2) },
            { name: "Other hammer.com", y: 0.75,
              color: Colors.lighten(Colors.presets[4], 0.4) },

            { name: "nromanov@shield.gov", y: 2.5,
              color: Colors.presets[5] },
            { name: "cbarton@shield.gov", y: 2.5,
              color: Colors.lighten(Colors.presets[5], 0.2) },
            { name: "Other shield.gov", y: 3,
              color: Colors.lighten(Colors.presets[5], 0.4)  },

            // { name: "tross@us.army.mil", y: 2.5,
            //   color: Colors.presets[6] },
            // { name: "bbanner@us.army.mil", y: 2,
            //   color: Colors.lighten(Colors.presets[6], 0.2) },

            // { name: "jrhodes@us.af.mil", y: 3, color: Colors.presets[7] },

            // { name: "hugh.jones@roxxon.com", y: 1.25,
            //   color: Colors.presets[8] },
            // { name: "cindy.shelton@roxxon.com", y: 1,
            //   color: Colors.lighten(Colors.presets[8], 0.2) },
            // { name: "Other Roxxon.com", y: 0.5,
            //   color: Colors.lighten(Colors.presets[1], 0.4) },

            // { name: "peter@parkertech.com", y: 2, color: Colors.presets[9] },

            // { name: "n0@beyondcorp.com", y: 1.25, color: Colors.presets[10] },
          ],
          dataLabels: {
            enabled: false,
            formatter: function() {
              if (this.percentage) {
                return `${this.point.name} ` +
                  `(${this.percentage.toFixed(1)}%)`;
              }
              return null;
            },
            color: '#ffffff',
            style: { textShadow: "" }
          }
        } as HighchartsPieChartSeriesOptions
      ]
    });
  }
}

// window.requestAnimationFrame(Esper.drawGuestDomains);
