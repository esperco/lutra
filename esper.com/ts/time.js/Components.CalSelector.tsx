/*
  Component for selecting a calendar + team combo
*/

/// <reference path="../lib/ApiT.ts" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Components.DropdownModal.tsx" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Esper.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Onboarding.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Components.ListSelector.tsx" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface CalSelectorProps {
    id?: string;
    selected: Calendars.CalSelection[];
    updateFn: (selections: Calendars.CalSelection[]) => void;
    minimized?: boolean;
    toggleMinimized?: () => void;
    allowMulti?: boolean;
    className?: string
  }

  export class CalSelector extends Component<CalSelectorProps, {}>
  {
    _className: string;

    renderWithData() {
      var groups = this.getGroups();
      var selected = this.getSelected();
      return <div className={this.props.className || this._className}>
        { groups.length ?
          <ListSelector groups={groups} selectedIds={selected}
            selectOption={ this.props.allowMulti ?
              ListSelectOptions.MULTI_SELECT :
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
      var teams = Teams.all();
      var groups = _.map(teams, (t) => {
        var calList = Calendars.CalendarListStore.val(t.teamid);
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

    renderWithData() {
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

      return <DropdownModal ref={(c) => this._dropdownModal = c}>
        <input type="text" id={this.props.id || this.getId("")}
               className="form-control dropdown-toggle end-of-group"
               readOnly={true}
               value={ selectedText } />
        { super.renderWithData() }
      </DropdownModal>;
    }

    updateCal(selectedIds: {id: string, groupId: string}[]) {
      if (this._dropdownModal) {
        this._dropdownModal.close();
      }
      return super.updateCal(selectedIds);
    }
  }

  export class CalSelectorDropdownWithIcon extends CalSelectorDropdown {
    renderWithData() {
      return <div className="input-group cal-selector">
        <span className="input-group-addon">
          <i className="fa fa-fw fa-calendar-o" />
        </span>
        { super.renderWithData() }
      </div>;
    }
  }
}
