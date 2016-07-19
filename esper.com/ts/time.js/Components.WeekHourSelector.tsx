/*
  Component for selecting hours + days of week. Currently only supports same
  hours for all selected days
*/

/// <reference path="./Components.SidebarSelector.tsx" />

module Esper.Components {

  // Default = 9 to 5;
  const DEFAULT_DAY_HOURS: Types.DayHours = {
    start: { hour: 9, minute: 0 },
    end: { hour: 17, minute: 0 }
  }

  interface Props {
    selected: Types.WeekHours;
    updateFn: (weekHours: Types.WeekHours) => void;
  }

  /*
    Use state to track intermediate state of what time is selected -- in case
    all days of week are unchecked and we have no day hours
  */
  interface State {
    dayHours: Types.DayHours;
  }

  class WeekHoursUI extends ReactHelpers.Component<Props, State> {
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
        props.selected.sun,
        props.selected.mon,
        props.selected.tue,
        props.selected.wed,
        props.selected.thu,
        props.selected.fri,
        props.selected.sat
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
      _.each(this.props.selected, (v: Option.T<Types.DayHours>, k: string) => {
        if (v && v.isSome()) { selectedIds.push(k) }
      });

      return <div className="day-selector">
        <div className="days">
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
        <div className="times">
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
      </div>;
    }

    update({selectedIds, start, end} : {
      selectedIds?: string[];
      start?: ApiT.HourMinute;
      end?: ApiT.HourMinute;
    }) {
      let newStart = Util.some(start, this.state.dayHours.start);
      let newEnd = Util.some(end, this.state.dayHours.end);
      if (newStart.hour * 60 + newStart.minute >
          newEnd.hour * 60 + newEnd.minute) {
        if (start) {
          newEnd = newStart;
        } else {
          newStart = newEnd;
        }
      }
      let dayHours = { start: newStart, end: newEnd };
      selectedIds = selectedIds || _.filter([
        this.props.selected.sun.isSome() ? "sun" : null,
        this.props.selected.mon.isSome() ? "mon" : null,
        this.props.selected.tue.isSome() ? "tue" : null,
        this.props.selected.wed.isSome() ? "wed" : null,
        this.props.selected.thu.isSome() ? "thu" : null,
        this.props.selected.fri.isSome() ? "fri" : null,
        this.props.selected.sat.isSome() ? "sat" : null
      ]);
      this.props.updateFn(
        Params.mapWeekHours(this.props.selected, (v, k) => this.updateHours(
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

  function TimeOfDayMenu({selected, onChange}: {
    selected: ApiT.HourMinute;
    onChange: (x: ApiT.HourMinute) => void;
  }) {

    return <SelectMenu
      options={makeOptions()}
      onChange={(x) => onChange(parseStrHourMinute(x))}
      selected={selected.hour.toString() + ":" + selected.minute.toString()}
    />;
  }

  // Converts "1:23" to { hour: 1, minute: 23 }
  function parseStrHourMinute(s: string): ApiT.HourMinute {
    let hour = parseInt(s.split(":")[0]);
    let minute = parseInt(s.split(":")[1]);
    return Params.cleanHourMinute({ hour: hour, minute: minute });
  }

  // Every 30 min
  function makeOptions() {
    var hm: ApiT.HourMinute[] = [];
    _.times(24, (i) => {
      hm.push({ hour: i, minute: 0 });
      hm.push({ hour: i, minute: 30 });
    });
    hm.push({ hour: 24, minute: 0 });
    return _.map(hm, (m) => ({
      val: m.hour.toString() + ":" + m.minute.toString(),
      display: moment(m).format("LT") // Format to local time
    }));
  }

  export class WeekHourSelector extends SidebarSelector<Props> {
    renderHeader() {
      return <span>
        <i className="fa fa-fw fa-clock-o" />{" "}
        { Text.WeekHours }
      </span>;
    }

    renderContent() {
      return React.createElement(WeekHoursUI, this.props);
    }
  }


}
