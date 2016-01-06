/*
  Interface for selecting date and time ranges
*/

/// <reference path="../marten/typings/bootstrap-daterangepicker/bootstrap-daterangepicker.d.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./TimeStats.ts" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface RangeProps {
    selected: TimeStats.TypedStatRequest;
    updateFn(value: TimeStats.TypedStatRequest): void;

    // Preset ranges
    presets?: { [index: string]: [Date, Date] };

    // Show interval buttons?
    showIntervals?: boolean;
  }

  export class IntervalRangeSelector extends Component<RangeProps, {}> {
    _input: React.Component<any, any>;

    render() {
      return (this.props.showIntervals ?
        <div className="input-group">
          { this.renderInput() }
          <div className="input-group-btn">
            { this.renderButton("Day", TimeStats.Interval.DAILY) }
            { this.renderButton("Week", TimeStats.Interval.WEEKLY) }
            { this.renderButton("Month", TimeStats.Interval.MONTHLY) }
          </div>
        </div> :
        this.renderInput());
    }

    renderInput() {
      return <input type="text" ref={(c) => this._input = c}
              className="form-control" />;
    }

    renderButton(text: string, interval: TimeStats.Interval) {
      var isSelected = this.props.selected &&
        _.eq(this.props.selected.interval, interval);
      return <button type="button" key={text}
          onClick={() => this.updateInterval(interval)}
          className={"btn btn-default " + (isSelected ? "active" : "")}>
        { text }
      </button>;
    }

    updateInterval(interval: TimeStats.Interval) {
      this.callUpdate(null, interval);
    }

    componentDidMount() {
      this.attachDateRangePicker();
    }

    attachDateRangePicker() {
      var opts: BootstrapDaterangepicker.Options = {
        autoApply: true,
        opens: "left",
        minDate: moment().subtract(6, 'months'),
        maxDate: moment().add(6, 'months')
      };
      if (this.props.selected) {
        var windowStarts = this.props.selected.windowStarts;
        if (windowStarts && windowStarts[0]) {
          opts.startDate = windowStarts[0];
        }

        if (this.props.selected.windowEnd) {
          opts.endDate = this.props.selected.windowEnd;
        }
      }
      var presets = this.props.presets || this.getDefaultPresets();
      if (presets) { opts.ranges = presets; }

      $(React.findDOMNode(this._input))
        .daterangepicker(opts)
        .on('apply.daterangepicker', this.handleApply.bind(this))
    }

    componentDidUpdate() {
      if (this.props.selected &&
          this.props.selected.windowStarts &&
          this.props.selected.windowStarts[0])
      {
        var picker = this.getPicker();
        if (picker) {
          if (! _.isEqual(picker.startDate,
                          this.props.selected.windowStarts[0]))
          {
            picker.setStartDate(this.props.selected.windowStarts[0]);
          }
          if (! _.isEqual(picker.endDate, this.props.selected.windowEnd)) {
            picker.setEndDate(this.props.selected.windowEnd);
          }
        }
        else {
          // Re-attach, old element got clobbered by React
          this.attachDateRangePicker();
        }
      }
    }

    getPicker() {
      return $(React.findDOMNode(this._input)).data('daterangepicker');
    }

    getDefaultPresets() {
      if (_.isUndefined(this.props.presets)) {
        var m2 = TimeStats.intervalCountRequest(2, TimeStats.Interval.MONTHLY);
        var w2 = TimeStats.intervalCountRequest(2, TimeStats.Interval.WEEKLY);
        var d30 = TimeStats.intervalCountRequest(30, TimeStats.Interval.DAILY);

        var ret: {[index: string]: [Date, Date]} = {
          "This Month": [m2.windowStarts[1], m2.windowEnd],
          "Last Month": [m2.windowStarts[0], m2.windowStarts[1]],
          "Last 30 Days": [d30.windowStarts[0], d30.windowEnd],
          "This Week": [w2.windowStarts[1], w2.windowEnd],
          "Last Week": [w2.windowStarts[0], w2.windowStarts[1]],
          "Last 7 Days": [d30.windowStarts[23], d30.windowEnd]
        };

        return ret;
      }
    }

    handleApply(e: JQueryEventObject,
                picker: BootstrapDaterangepicker.Picker)
    {
      this.callUpdate(picker);
    }

    callUpdate(picker?: BootstrapDaterangepicker.Picker,
               interval?: TimeStats.Interval)
    {
      // Set default picker and interval
      var picker = picker || this.getPicker();
      var interval = interval || (
        this.props.selected && this.props.selected.interval);

      // Round to beginning / end of days
      var start = picker.startDate.clone().startOf('day');
      var end = picker.endDate.clone().endOf('day');
      var req = TimeStats.periodRequest(start.toDate(), end.toDate(),
                                        interval);
      this.props.updateFn(req);
    }
  }
}
