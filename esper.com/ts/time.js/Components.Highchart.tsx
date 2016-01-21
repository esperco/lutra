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
      var defaults: HighchartsOptions = {
        credits: { enabled: false },
        title: { text: "" },
        tooltip: {
          pointFormat: (
            `<span style="color:{point.color}">{series.name}:</span> ` +
            `{point.y}` + (this.props.units ? " " + this.props.units : "") +
            `<br/>`)
        }
      };
      return _.extend(defaults, this.props.opts)
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
