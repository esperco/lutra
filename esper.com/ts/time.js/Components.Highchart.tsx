/*
  Component for a Highchart
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // Custom drillup button
  const DRILLUP_ID_CLS = 'highchart-drillup';

  export interface HighchartsOpts {
    opts: HighchartsOptions;
    units?: string;
  }

  // Simple wrapper around HighCharts config object
  export class Highchart extends Component<HighchartsOpts, {}> {
    _container: HTMLElement;
    _chart: HighchartsChartObject;
    _drilldownLevels: number;

    render() {
      return <div ref={(c) => this._container = c }
                  className="chart-holder" />;
    }

    getOpts(): HighchartsOptions {
      var units = this.props.units;
      var defaults: HighchartsOptions = {
        credits: { enabled: false },
        title: { text: "" },

        chart: {
          events: {
            drilldown: this.onDrilldown.bind(this),
            drillup: this.onDrillup.bind(this)
          }
        },

        plotOptions: {
          series: {
            animation: { duration: 500 }
          }
        },

        tooltip: {
          formatter: function() {
            var name = this.point.name || this.series.name;
            return `<b>${name}:</b> ${this.y} ${units || ''}` +
              (this.percentage ?
                ` (${Util.roundStr(this.percentage, 1)}%)`
                : "");
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

        drilldown: {
          drillUpButton: {
            theme: {
              display: "none"
            }
          }
        }
      };

      return _.merge(defaults, this.props.opts)
    }

    componentDidMount() {
      $(this._container).highcharts(this.getOpts());
      this._chart = $(this._container).highcharts();
    }

    /*
      For now, just blow away and redraw chart everytime props change. Maybe
      use update system if this leads to poor UX.
    */
    componentDidUpdate() {
      $(this._container).highcharts(this.getOpts())
      this._chart = $(this._container).highcharts();
      this.resetDrillupBtn();
    }

    // Use jQuery to draw our custom drillUp button because sticking React
    // here is a bit weird
    onDrilldown() {
      // Only insert if drilldown button is not already there
      if (! $(this._container).find("." + DRILLUP_ID_CLS).length) {
        var btn = $("<button type=\"button\" />");
        btn.append($("<i class=\"fa fa-fw fa-angle-left\" />"));
        btn.addClass("btn btn-secondary");
        btn.addClass(DRILLUP_ID_CLS);
        btn.click(() => {
          this._chart.drillUp();
        });
        $(this._container).append(btn);
      }
      this._drilldownLevels = this._drilldownLevels || 0;
      this._drilldownLevels += 1;
    }

    onDrillup() {
      if (this._drilldownLevels) {
        this._drilldownLevels -= 1;
      }
      if (! this._drilldownLevels) {
        this.resetDrillupBtn()
      }
    }

    resetDrillupBtn() {
      $(this._container).find("." + DRILLUP_ID_CLS).remove();
      this._drilldownLevels = 0;
    }
  }
}
