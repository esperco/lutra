/*
  Component for a Highchart
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export interface HighchartsOpts {
    opts: HighchartsOptions;
    units?: string;
  }

  // Simple wrapper around HighCharts config object
  export class Highchart extends Component<HighchartsOpts, {}> {
    _container: HTMLElement;

    render() {
      return <div ref={(c) => this._container = c }
                  className="chart-holder" />;
    }

    getOpts(): HighchartsOptions {
      var units = this.props.units;
      var defaults: HighchartsOptions = {
        credits: { enabled: false },
        title: { text: "" },

        plotOptions: {
          series: {
            animation: { duration: 500 }
          }
        },

        tooltip: {
          formatter: function() {
            return `<b>${this.series.name}:</b> ${this.y} ${units}` +
              (this.percentage ? ` (${this.percentage.toFixed(2)}%)` : "");
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
        }
      };

      return _.merge(defaults, this.props.opts)
    }

    componentDidMount() {
      $(this._container).highcharts(this.getOpts());
    }

    /*
      For now, just blow away and redraw chart everytime props change. Maybe
      use update system if this leads to poor UX.
    */
    componentDidUpdate() {
      $(this._container).highcharts(this.getOpts())
    }
  }
}
