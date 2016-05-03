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

  // Custom export button
  const EXPORT_ID_CLS = 'highchart-export';

  export interface HighchartsOpts {
    opts: HighchartsOptions;
    units?: string;
  }

  // Simple wrapper around HighCharts config object
  export class Highchart extends Component<HighchartsOpts, {}> {
    _container: HTMLElement;
    _target: HTMLElement;
    _chart: HighchartsChartObject;
    _drilldownLevels: number;

    render() {
      return <div ref={(c) => this._container = c}
                  className="chart-holder-parent">
        <div ref={(c) => this._target = c}
             className="chart-holder" />
        <button type="button"
                style={{display: "none"}}
                onClick={() => this.drillUp()}
                className={classNames("btn", "btn-secondary", DRILLUP_ID_CLS)}>
          <i className="fa fa-fw fa-angle-left" />
        </button>
        <button type="button"
                onClick={() => this.exportChart()}
                className={classNames("btn", "btn-secondary", EXPORT_ID_CLS)}>
          <i className="fa fa-fw fa-download" />
        </button>
      </div>;
    }

    getOpts(): HighchartsOptions {
      var units = this.props.units;
      var defaults: HighchartsOptions = {
        credits: { enabled: false },
        title: { text: "" },

        chart: {
          backgroundColor: 'transparent',
          events: {
            drilldown: this.onDrilldown.bind(this),
            drillup: this.onDrillup.bind(this)
          },
          style: {
            fontFamily: 'Open Sans, Helvetica Neue, Helvetica, Arial, sans-serif'
          }
        },

        exporting: { enabled: false },

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
      $(this._target).highcharts(this.getOpts());
      this._chart = $(this._target).highcharts();
    }

    /*
      For now, just blow away and redraw chart everytime props change. Maybe
      use update system if this leads to poor UX.
    */
    componentDidUpdate() {
      $(this._target).highcharts(this.getOpts())
      this._chart = $(this._target).highcharts();
      this.resetDrillupBtn();
    }

    // Use jQuery to show / hide our custom drill-up button because using React
    // directly may result in Highchart being clobbered / redrawn
    onDrilldown() {
      $(this._container).find("." + DRILLUP_ID_CLS).show();
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
      $(this._container).find("." + DRILLUP_ID_CLS).hide();
      this._drilldownLevels = 0;
    }

    drillUp() {
      if (this._chart) {
        this._chart.drillUp();
      }
    }

    exportChart() {
      if (this._chart) {
        this._chart.exportChartLocal({
          type: "image/png",
          fallbackToExportServer: false
        }, {
          chart: { backgroundColor: '#FFFFFF' }
        });
      }
    }
  }
}
