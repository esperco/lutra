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

  // Some props we need all ChartCanvasProps to have
  interface ChartCanvasProps {
    // Actual width and height are irrelevant -- chart always expands to fill
    // width of container, but their ratio determines height of element
    width: number;
    height: number;
  }

  export class ChartCanvas<P extends ChartCanvasProps> extends Component<P,{}> {
    _canvas: React.Component<any, any>;
    _chartObj: Chart;

    render() {
      return <div className="canvas-holder">
        {this.renderCanvas()}
      </div>;
    }

    renderCanvas() {
      return <canvas ref={(c) => this._canvas = c}
        width={this.props.width}
        height={this.props.height}>
      </canvas>;
    }

    // Subclass should call super to apply a particular kind of chart
    componentDidMount() {
      var canvas = React.findDOMNode(this._canvas) as HTMLCanvasElement;
      this._chartObj = new Chart(canvas.getContext("2d"));
    }

    // We're using Chart.js, so don't accidentally clobber our canvas
    // by using React's property update
    shouldComponentUpdate() {
      return false;
    }

    /* TODO - set in subclasses to update our chart data when we get new props

    // Example only ...
    componentWillReceiveProps(props: P) {
      this._lineChart.datasets[0].points[2].value = 50;
      this._lineChart.update();
    }

    */
  }

  export interface BarChartProps extends ChartCanvasProps {
    units?: string;
    verticalLabel?: string;
    data: LinearChartData;
  }

  export class BarChart extends ChartCanvas<BarChartProps> {
    _barChart: LinearInstance;

    render() {
      if (this.props.verticalLabel) {
        return <div className="canvas-holder with-vertical-label">
          {this.renderCanvas()}
          <div className="vertical-label">{this.props.verticalLabel}</div>
        </div>;
      } else {
        return super.render();
      }
    }

    componentDidMount() {
      super.componentDidMount();

      var options: BarChartOptions = {};
      var suffix = (this.props.units ? (" " + this.props.units) : "");
      options.tooltipTemplate =
        "<%if (label){%><%=label%> - <%}%><%= value %>" + suffix;
      options.multiTooltipTemplate =
        "<%if (datasetLabel){%><%=datasetLabel%><%}%> - <%= value %>" + suffix;

      this._barChart = this._chartObj.Bar(this.props.data, options);
    }
  }
}