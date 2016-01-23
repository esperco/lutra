/*
  Interface for selecting date and time ranges
*/

/// <reference path="../typings/bootstrap-daterangepicker/bootstrap-daterangepicker.d.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./TimeStats.ts" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface RangeProps {
    selected: TimeStats.RequestPeriod;
    updateFn(value: TimeStats.RequestPeriod): void;

    // Preset ranges
    presets?: { [index: string]: [Date, Date] };

    // Show interval buttons?
    showIntervals?: boolean;
  }

  export class IntervalRangeSelector extends Component<RangeProps, {}> {
    _input: HTMLInputElement;

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
        if (this.props.selected.windowEnd) {
          opts.startDate = this.props.selected.windowStart;
        }

        if (this.props.selected.windowEnd) {
          opts.endDate = this.props.selected.windowEnd;
        }
      }
      var presets = this.props.presets || this.getDefaultPresets();
      if (presets) { opts.ranges = presets; }

      var inputElm = $(this._input);
      if (inputElm.is(":visible")) {
        inputElm.daterangepicker(opts)
                .on('apply.daterangepicker', this.handleApply.bind(this))
      }
    }

    componentDidUpdate() {
      if (this.props.selected &&
          this.props.selected.windowStart)
      {
        var picker = this.getPicker();
        if (picker) {
          if (! _.isEqual(picker.startDate,
                          this.props.selected.windowStart))
          {
            picker.setStartDate(this.props.selected.windowStart);
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
      return $(this._input).data('daterangepicker');
    }

    getDefaultPresets() {
      if (_.isUndefined(this.props.presets)) {
        var month = 'month';
        var week = 'week';
        var day = 'day';

        var m: {[index: string]: [moment.Moment, moment.Moment]} = {
          "This Month": [ moment().startOf(month), moment().endOf(month) ],
          "Last Month": [ moment().startOf(month).subtract(1, month),
                          moment().endOf(month).subtract(1, month) ],
          "Last 30 Days": [ moment().startOf(day).subtract(30, day),
                            moment().endOf(day) ],
          "This Week": [ moment().startOf(week), moment().endOf(week) ],
          "Last Week": [ moment().startOf(week).subtract(1, week),
                         moment().endOf(week).subtract(1, week) ],
          "Last 7 Days": [ moment().startOf(day).subtract(7, day),
                           moment().endOf(day) ]
        };

        var ret: {[index: string]: [Date, Date]} = {};
        _.each(m, (v, k) => {
          ret[k] = [v[0].toDate(), v[1].toDate()];
        })

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
      this.props.updateFn({
        windowStart: start.toDate(),
        windowEnd: end.toDate(),
        interval: interval
      });
    }
  }
}
