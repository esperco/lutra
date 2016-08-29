/*
  Component for a Highchart
*/

/// <reference path="../lib/ReactHelpers.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // Custom export button
  const EXPORT_ID_CLS = 'highchart-export';

  export interface HighchartsOpts {
    opts: HighchartsOptions;
    showExport?: boolean;
    units?: string;
  }

  // Simple wrapper around HighCharts config object
  export class Highchart extends Component<HighchartsOpts, {}> {
    _container: HTMLElement;
    _target: HTMLElement;
    _chart: HighchartsChartObject;

    render() {
      return <div ref={(c) => this._container = c}
                  className="chart-holder-parent">
        <div ref={(c) => this._target = c}
             className="chart-holder" />
        { this.props.showExport ? <button type="button"
                onClick={() => this.exportChart()}
                className={classNames("btn", "btn-default", EXPORT_ID_CLS)}>
          <i className="fa fa-fw fa-download" />
        </button> : null }
      </div>;
    }

    getOpts(): HighchartsOptions {
      var units = this.props.units;
      var defaults: HighchartsOptions = {
        credits: { enabled: false },
        title: { text: "" },

        chart: {
          backgroundColor: 'transparent',
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
    componentDidUpdate(oldProps: HighchartsOpts) {
      $(this._target).highcharts(this.getOpts())
      this._chart = $(this._target).highcharts();
    }

    exportChart() {
      if (this._chart) {
        // Modify chart for export
        var chartOpts = this.props.opts.chart;

        // Non-transparent background
        var exportOpts: HighchartsChartOptions = {
          backgroundColor: '#FFFFFF'
        };

        // Make pie charts wider (to correct for label cut off)
        if (chartOpts && chartOpts.type === 'pie') {
          exportOpts.width = 1500;
          exportOpts.height = 800;
        } else {
          exportOpts.width = 1200;
          exportOpts.height = 800;
        }

        this._chart.exportChartLocal({
          type: "image/png",
          fallbackToExportServer: false
        }, {
          chart: exportOpts
        });
      }
    }
  }
}
