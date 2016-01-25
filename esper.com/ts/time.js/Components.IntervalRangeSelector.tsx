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

    // Limits on range
    dateLimit?: moment.MomentInput;
    dateLimitForInterval?: (interval: TimeStats.Interval) => moment.MomentInput;
    minDate?: BootstrapDaterangepicker.DateType;
    maxDate?: BootstrapDaterangepicker.DateType;

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
        minDate: this.props.minDate,
        maxDate: this.props.maxDate,
        dateLimit: this.getDateLimit()
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
      if (presets) {

        // Filter out presets that don't make sense given limits
        var maxMs: number;
        if (opts.dateLimit) {
          maxMs = moment.duration(opts.dateLimit).as('milliseconds');
        }

        var minMs: number;
        if (this.props.showIntervals) {
          var m: moment.MomentInput;
          switch (this.props.selected.interval) {
            case TimeStats.Interval.DAILY:
              m = {day: 1};
              break;
            case TimeStats.Interval.WEEKLY:
              m = {day: 7};
              break;
            default:
              m = {month: 1};
          }
          var minMs = moment.duration(m).as('milliseconds');
        }

        var f: {[index: string]: [Date, Date]} = {};
        _.each(presets, (v, k) => {
          var length = moment(v[1]).diff(moment(v[0]));
          if (length <= maxMs && length >= minMs) {
            f[k] = v;
          }
        })
        opts.ranges = f;
      }

      var inputElm = $(this._input);
      if (inputElm.is(":visible")) {
        inputElm.daterangepicker(opts)
                .on('apply.daterangepicker', this.handleApply.bind(this))
      }
    }

    getDateLimit() {
      if (this.props.dateLimitForInterval &&
          this.props.showIntervals &&
          _.isNumber(this.props.selected.interval)) {
        return this.props.dateLimitForInterval(this.props.selected.interval);
      }

      else if (this.props.dateLimit) {
        return this.props.dateLimit;
      }
    }

    componentDidUpdate() {
      this.attachDateRangePicker();
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
