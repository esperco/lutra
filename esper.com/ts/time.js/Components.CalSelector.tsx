/*
  Component for selecting a calendar + team combo
*/

/// <reference path="../lib/ApiT.ts" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.DropdownModal.tsx" />
/// <reference path="../lib/Components.Selector.tsx" />
/// <reference path="../lib/Layout.tsx" />
/// <reference path="./Esper.ts" />
/// <reference path="./Onboarding.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Components.ListSelector.tsx" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface CalSelectorProps {
    id?: string;
    className?: string;
    teams: ApiT.Team[];
    calendarsByTeamId: {[index: string]: ApiT.GenericCalendar[]};
    selected: Calendars.CalSelection[];
    updateFn: (selections: Calendars.CalSelection[]) => void;
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
            listClasses="esper-select-menu"
            itemClasses="esper-selectable"
            headerClasses="esper-select-header"
            updateFn={this.updateCal.bind(this)}
          /> : null
        }
        { groups.length ? <div className="divider" /> : null }
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
      return _.map(this.props.selected, (s) => {
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
        Route.nav.path("/calendar-setup" + (
          this.props.selected.length ? "/" + this.props.selected[0].teamId : ""
        ))
      );
    }
  }


  export class CalSelectorDropdown extends CalSelector {
    _dropdownModal: DropdownModal;

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

      return <DropdownModal
              ref={ (c) => this._dropdownModal = c }
              keepOpen={ this.props.allowMulti }>
        <Selector id={this.props.id} className="dropdown-toggle end-of-group">
          { selectedText }
        </Selector>
        { super.render() }
      </DropdownModal>;
    }

    updateCal(selectedIds: {id: string, groupId: string}[]) {
      if (this._dropdownModal && !this.props.allowMulti) {
        this._dropdownModal.close();
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
