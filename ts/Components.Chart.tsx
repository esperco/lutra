/*
  Component for a Chart.js canvas
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // Set some global defaults for Chart.js
  Chart.defaults.global.responsive = true;
  Chart.defaults.global.maintainAspectRatio = false;

  export abstract class ChartCanvas<P> extends Component<P,{}>
  {
    _canvas: React.Component<any, any>;
    chartObj: Chart;
    chartInstance: ChartInstance;

    render() {
      return <div className="canvas-holder">
        {this.renderCanvas()}
      </div>;
    }

    renderCanvas() {
      return <canvas ref={(c) => this._canvas = c} />;
    }

    /*
      Where Chart.js gets initially invoked -- chart specifics are controlled
      by this.getChartInstance (called by this.drawChart).
    */
    componentDidMount() {
      var canvas = React.findDOMNode(this._canvas) as HTMLCanvasElement;
      this.chartObj = new Chart(canvas.getContext("2d"));
      this.drawChart();
    }

    /*
      For now, just blow away and redraw chart everytime props change. Maybe
      use this.chartInstance.update instead if this leads to poor UX.
    */
    componentDidUpdate() {
      this.cleanupChart();
      this.drawChart();
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      this.cleanupChart();
    }

    drawChart() {
      if (this.chartInstance) {
        this.cleanupChart();
      }
      this.chartInstance = this.getChartInstance(this.chartObj);
    }

    cleanupChart() {
      this.chartInstance.destroy();
      delete this.chartInstance;
    }

    // Override to draw specific line or bar or whatever chart
    abstract getChartInstance(chart: Chart): ChartInstance;
  }

  export interface BarChartProps {
    units?: string;
    horizontalLabel?: string;
    verticalLabel?: string;
    data: LinearChartData;
  }

  export class BarChart extends ChartCanvas<BarChartProps> {
    _barChart: LinearInstance;

    render() {
      var classNames=["canvas-holder"];
      if (this.props.verticalLabel) {
        classNames.push("with-vertical-label");
      }
      if (this.props.horizontalLabel) {
        classNames.push("with-horizontal-label");
      }
      return <div className={classNames.join(" ")}>
        {this.renderCanvas()}
        {
          this.props.verticalLabel ?
          <div className="vertical-label">{this.props.verticalLabel}</div> :
          ""
        }
        {
          this.props.horizontalLabel ?
          <div className="horizontal-label">{this.props.horizontalLabel}</div> :
          ""
        }
      </div>;
    }

    getChartInstance(chartObj: Chart) {
      var options: BarChartOptions = {};
      var suffix = (this.props.units ? (" " + this.props.units) : "");
      options.tooltipTemplate =
        "<%if (label){%><%=label%> - <%}%><%= value %>" + suffix;
      options.multiTooltipTemplate =
        "<%if (datasetLabel){%><%=datasetLabel%><%}%> - <%= value %>" + suffix;

      return chartObj.Bar(this.props.data, options);
    }
  }
}