/*
  Component for selecting a calendar for a given team
*/

/// <reference path="./Components.CalcUI.tsx" />

module Esper.Components {
  export class CalCalcSelector
    extends CalcUI<Types.EventOptGrouping, {
      id?: string;
      calculation: EventStats.CalendarCountCalc;
      calendars: ApiT.GenericCalendar[];
      selectedIds: string[];
      updateFn: (ids: string[]) => void;
    }>
  {
    render() {
      return this.state.result.match({
        none: () => <div className="esper-no-content">
          { Text.UICalculating }
        </div>,
        some: (optGroups) => {
          let grouping = optGroups.some;
          let choices = _.map(this.props.calendars, (c) => {
            let count = grouping[c.id] && grouping[c.id].totalUnique;
            return {
              id: c.id,
              displayAs: this.getDisplayName(c.id),
              badgeText: count ? count.toString() : undefined,
              badgeHoverText: count ? Text.events(count) : undefined,
              badgeColor: Colors.getColorForCal(c.id)
            };
          });

          return <Components.ListSelectorSimple
            choices={choices}
            selectedIds={this.props.selectedIds}
            selectOption={Components.ListSelectOptions.MULTI_SELECT}
            selectedItemClasses="active"
            className="esper-select-menu"
            listClasses="esper-select-menu"
            itemClasses="esper-selectable"
            updateFn={this.props.updateFn}
          />
        }
      })
    }

    getDisplayName(calId: string) {
      var cal = _.find(this.props.calendars, (c) => c.id === calId);
      if (cal) return cal.title;
      return calId;
    }
  }

  export class CalCalcDropdownSelector extends CalCalcSelector {
    render() {
      var selectedText =
        this.props.selectedIds.length >= this.props.calendars.length ?
        Text.AllCalendars : _.map(this.props.selectedIds,
          (calId) => this.getDisplayName(calId)
        ).join(", ");

      return <Dropdown keepOpen={true}>
        <Selector id={this.props.id} className="dropdown-toggle">
          { selectedText }
        </Selector>
        <div className="dropdown-menu">
          { super.render() }
        </div>
      </Dropdown>;
    }
  }


  /* Deprecated cal selectors -- use calc selector going forward */

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface CalSelectorProps {
    id?: string;
    className?: string;
    teams: ApiT.Team[];
    calendarsByTeamId: {[index: string]: ApiT.GenericCalendar[]};
    selected: Stores.Calendars.CalSelection[];
    updateFn: (selections: Stores.Calendars.CalSelection[]) => void;
    minimized?: boolean;
    toggleMinimized?: () => void;
    allowMulti?: boolean;
  }

  export class CalSelector extends Component<CalSelectorProps, {}>
  {
    _className: string;

    render() {
      var groups = this.getGroups();
      var selected = this.getSelected();
      return <div className={this.props.className || this._className}>
        { groups.length ?
          <ListSelector groups={groups} selectedIds={selected}
            selectOption={ this.props.allowMulti ?
              ListSelectOptions.MULTI_SELECT_ONE_GROUP :
              ListSelectOptions.SINGLE_SELECT }
            selectedItemClasses="active"
            selectedIcon="fa-calendar-check-o"
            unselectedIcon="fa-calendar-o"
            className="esper-select-menu"
            listClasses="esper-select-menu"
            itemClasses="esper-selectable"
            headerClasses="esper-select-header"
            updateFn={this.updateCal.bind(this)}
          /> : null
        }
        <div className="esper-select-menu">
          <a className="esper-selectable"
             onClick={this.editCalendars.bind(this)}>
            <i className="fa fa-fw fa-calendar-check-o" />{" "}
            Add / Remove Calendars
          </a>
        </div>
      </div>;
    }

    getGroups() {
      var groups = _.map(this.props.teams, (t) => {
        var calList = this.props.calendarsByTeamId[t.teamid];
        return {
          id: t.teamid,
          displayAs: t.team_name,
          choices: _.map(calList, (c) => {
            return {
              id: c.id,
              displayAs: c.title || <span className="esper-placeholder" />
            };
          })
        }
      });
      groups = _.filter(groups, (g) => g.choices.length > 0);
      if (groups.length === 1) {
        groups[0].displayAs = null; // Don't display name for single group
      }

      return groups;
    }

    getSelected() {
      // Selected => only if stored on team
      let selected = _.filter(this.props.selected, (s) =>
        !!_.find(this.props.calendarsByTeamId[s.teamId] || [],
                 (c) => c.id === s.calId)
      )

      return _.map(selected, (s) => {
        return {
          id: s.calId,
          groupId: s.teamId
        };
      });
    }

    // Convert ListSelector format to calSeletion
    updateCal(selectedIds: {id: string, groupId: string}[]) {
      this.props.updateFn(_.map(selectedIds, (x) => {
        return {
          calId: x.id,
          teamId: x.groupId
        };
      }));
    }

    // Pop up calendar modal. Auto-select when modal closed.
    editCalendars() {
      // Delay to avoid React trying to close dropdown after redirect
      window.requestAnimationFrame(() =>
        Route.nav.go(Paths.Manage.Team.calendars(
          this.props.selected.length ?
          {teamId: this.props.selected[0].teamId} : {}
        ))
      );
    }
  }


  export class CalSelectorDropdown extends CalSelector {
    _dropdown: Dropdown;

    constructor(props: CalSelectorProps) {
      super(props);
      this._className = "dropdown-menu";
    }

    render() {
      var groups = this.getGroups();
      var selected = this.getSelected();
      var selectedText = ((): string => {
        if (selected.length > 1) {
          return selected.length + " Calendars Selected";
        }
        if (selected.length === 1) {
          var g = _.find(groups, (g) => g.id === selected[0].groupId);
          if (g) {
            var c = _.find(g.choices, (c) => c.id === selected[0].id);
            if (c) {
              if (typeof c.displayAs === "string") {
                return c.displayAs.toString();
              }
              return "Loading ...";
            }
          }
        }
        return "No Calendars Selected"
      })();

      return <Dropdown
              ref={ (c) => this._dropdown = c }
              keepOpen={ this.props.allowMulti }>
        <Selector id={this.props.id} className="dropdown-toggle end-of-group">
          { selectedText }
        </Selector>
        { super.render() }
      </Dropdown>;
    }

    updateCal(selectedIds: {id: string, groupId: string}[]) {
      if (this._dropdown && !this.props.allowMulti) {
        this._dropdown.close();
      }
      return super.updateCal(selectedIds);
    }
  }

  export class CalSelectorDropdownWithIcon extends CalSelectorDropdown {
    render() {
      return <div className="input-group cal-selector">
        <span className="input-group-addon">
          <i className="fa fa-fw fa-calendar-o" />
        </span>
        { super.render() }
      </div>;
    }
  }
}
