/*
  Component for selecting hours + days of week. Currently only supports same
  hours for all selected days
*/

module Esper.Components {

  // Default = 9 to 5;
  const DEFAULT_DAY_HOURS: Types.DayHours = {
    start: { hour: 9, minute: 0 },
    end: { hour: 17, minute: 0 }
  }

  interface Props {
    hours: Types.WeekHours;
    updateHours: (weekHours: Types.WeekHours) => void;
    showUnscheduled?: boolean;
    unscheduled: boolean;
    updateUnscheduled: (x: boolean) => void;
  }

  /*
    Use state to track intermediate state of what time is selected -- in case
    all days of week are unchecked and we have no day hours
  */
  interface State {
    dayHours: Types.DayHours;
  }

  export function WeekHourDropdownSelector(props: Props & {
    id?: string;
  }) {
    // Dropdown input text
    let selectedText = _.isEqual(props.hours, Params.weekHoursAll()) ?
      Text.AllWeekHours : Text.SomeWeekHours;

    return <Dropdown keepOpen={true}>
      <Selector id={props.id} className="dropdown-toggle">
        { selectedText }
      </Selector>
      <div className="dropdown-menu">
        <WeekHoursSelector {...props} />
      </div>
    </Dropdown>;
  }

  export class WeekHoursSelector extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        dayHours: this.getDayHours(props)
      };
    }

    componentWillReceiveProps(props: Props) {
      this.setState({
        dayHours: this.getDayHours(props)
      });
    }

    getDayHours(props: Props) {
      var dayHours = Option.flatten([
        props.hours.sun,
        props.hours.mon,
        props.hours.tue,
        props.hours.wed,
        props.hours.thu,
        props.hours.fri,
        props.hours.sat
      ]);
      if (dayHours.length) {
        return dayHours[0];
      }
      return DEFAULT_DAY_HOURS;
    }

    render() {
      let day = moment(new Date(2016, 0, 3)); // Sunday
      let choices = [
        { id: "sun", displayAs: day.format("dd") },
        { id: "mon", displayAs: day.add(1, 'day').format("dd") },
        { id: "tue", displayAs: day.add(1, 'day').format("dd") },
        { id: "wed", displayAs: day.add(1, 'day').format("dd") },
        { id: "thu", displayAs: day.add(1, 'day').format("dd") },
        { id: "fri", displayAs: day.add(1, 'day').format("dd") },
        { id: "sat", displayAs: day.add(1, 'day').format("dd") }
      ];
      let selectedIds: string[] = [];
      _.each(this.props.hours, (v: Option.T<Types.DayHours>, k: string) => {
        if (v && v.isSome()) { selectedIds.push(k) }
      });

      return <div>
        <div className="day-selector esper-select-menu">
          <div className="days esper-select-menu">
            <ListSelectorSimple
              choices={choices}
              listClasses="esper-select-menu esper-flex-list"
              itemClasses="esper-selectable"
              selectedItemClasses="active"
              selectedIds={selectedIds}
              selectOption={ListSelectOptions.MULTI_SELECT}
              updateFn={(ids) => this.update({selectedIds: ids})}
            />
          </div>
          <div className="times esper-select-menu">
            <span className="hour-minute">
              <TimeOfDayMenu
                onChange={(x) => this.update({ start: x })}
                selected={this.state.dayHours.start}
              />
            </span>
            <span className="dash">&ndash;</span>
            <span className="hour-minute">
              <TimeOfDayMenu
                onChange={(x) => this.update({ end: x })}
                selected={this.state.dayHours.end}
              />
            </span>
          </div>
        </div>
        { this.props.showUnscheduled ?
          <div className="unscheduled-selector esper-select-menu">
            <SimpleToggle
              title={Text.IncUnscheduled}
              active={this.props.unscheduled}
              onChange={this.props.updateUnscheduled}
            />
          </div> : null }
      </div>;
    }

    update({selectedIds, start, end} : {
      selectedIds?: string[];
      start?: ApiT.HourMinute;
      end?: ApiT.HourMinute;
    }) {
      let newStart = Util.some(start, this.state.dayHours.start);
      let newEnd = Util.some(end, this.state.dayHours.end);

      // 12am at end should be interpreted as end of day
      if (newEnd.hour === 0 && newEnd.minute === 0) {
        newEnd = { hour: 24, minute: 0 };
      }

      // Invalid date
      if (newStart.hour * 60 + newStart.minute >=
          newEnd.hour * 60 + newEnd.minute) {

        // Start provided, so end must be off
        if (start) {
          newEnd = { hour: 24, minute: 0 };
        }

        // Check if AM/PM off
        else if (newEnd.hour < 12 &&
          (newEnd.hour + 12) * 60 + newEnd.minute >
           newEnd.hour * 60 + newEnd.minute) {
          newEnd.hour += 12;
        }

        // Early end, start at midnight
        else {
          newStart = { hour: 0, minute: 0 };
        }
      }

      let dayHours = { start: newStart, end: newEnd };
      selectedIds = selectedIds || _.filter([
        this.props.hours.sun.isSome() ? "sun" : null,
        this.props.hours.mon.isSome() ? "mon" : null,
        this.props.hours.tue.isSome() ? "tue" : null,
        this.props.hours.wed.isSome() ? "wed" : null,
        this.props.hours.thu.isSome() ? "thu" : null,
        this.props.hours.fri.isSome() ? "fri" : null,
        this.props.hours.sat.isSome() ? "sat" : null
      ]);
      this.props.updateHours(
        WeekHours.map(this.props.hours, (v, k) => this.updateHours(
          v, _.includes(selectedIds, k), dayHours
        )));
    }

    // Map day hours to current state
    updateHours(dayHoursOpt: Option.T<Types.DayHours>,
                active?: boolean,
                newHours?: Types.DayHours) {
      if (Util.some(active, dayHoursOpt.isSome())) {
        newHours = newHours || this.state.dayHours;
        return Option.some(newHours);
      }
      return Option.none<Types.DayHours>();
    }
  }


  interface TimeOfDayProps {
    selected: ApiT.HourMinute;
    onChange: (x: ApiT.HourMinute) => void;
  }

  class TimeOfDayMenu extends ReactHelpers.Component<TimeOfDayProps, {
    value: string;
  }> {
    _input: HTMLInputElement;

    constructor(props: TimeOfDayProps) {
      super(props);
      this.state = { value: moment(this.props.selected).format("LT") };
    }

    componentWillReceiveProps(newProps: TimeOfDayProps) {
      this.setState({
        value: moment(newProps.selected).format("LT")
      });
    }

    render() {
      // Format to local time
      return <input ref={(c) => this._input = c}
        className="form-control"
        value={this.state.value}
        onChange={(x) => this.setState({
          value: (x.target as HTMLInputElement).value
        })}
        onBlur={() => this.onBlur()}
      />;
    }

    onBlur() {
      if (this._input) {
        this.props.onChange(parseStrHourMinute(this._input.value));
      }
    }
  }

  // Converts "1:23" to { hour: 1, minute: 23 }
  function parseStrHourMinute(s: string): ApiT.HourMinute {
    let hour = parseInt(s.split(":")[0]) % 12;
    let minute = parseInt(s.split(":")[1]) % 60;
    if (_.includes(s.toLowerCase(), "p")) { // PM
      hour += 12;
    }

    hour = isNaN(hour) ? 0 : hour;
    minute = isNaN(minute) ? 0 : minute;

    return Params.cleanHourMinute({ hour: hour, minute: minute });
  }
}
