/*
  Component for selecting a calendar + team combo
*/

/// <reference path="../lib/ApiT.ts" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Esper.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Onboarding.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Components.CalAdd.tsx" />
/// <reference path="./Components.ListSelector.tsx" />
/// <reference path="./Components.Section.tsx" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface CalSelectorProps {
    selected: Calendars.CalSelection[];
    updateFn: (selections: Calendars.CalSelection[]) => void;
    minimized?: boolean;
    toggleMinimized?: () => void;
    allowMulti?: boolean;
  }

  export class CalSelector extends Component<CalSelectorProps, {}>
  {
    renderWithData() {
      var teams = Teams.all();
      var groups = _.map(teams, (t) => {
        var calList = Calendars.CalendarListStore.val(t.teamid);
        return {
          id: t.teamid,
          displayAs: t.team_name,
          choices: _.map(calList, (c) => {
            return {
              id: c.id,
              displayAs: c.title
            };
          })
        }
      });
      groups = _.filter(groups, (g) => g.choices.length > 0);
      if (groups.length === 1) {
        groups[0].displayAs = null; // Don't display name for single group
      }

      var selected = _.map(this.props.selected, (s) => {
        return {
          id: s.calId,
          groupId: s.teamId
        };
      });

      return <BorderlessSection icon="fa-calendar" title="Select Calendar"
          minimized={this.props.minimized}
          toggleMinimized={this.props.toggleMinimized}>
        { groups.length ?
          <ListSelector groups={groups} selectedIds={selected}
            selectOption={ this.props.allowMulti ?
              ListSelectOptions.MULTI_SELECT :
              ListSelectOptions.SINGLE_SELECT }
            selectedItemClasses="active"
            selectedIcon="fa-calendar-check-o"
            unselectedIcon="fa-calendar-o"
            updateFn={this.updateCal.bind(this)}
          /> :
          <div className="esper-no-content">
            <a onClick={this.editCalendars.bind(this)}>
              No calendars available. Click here to add.
            </a>
          </div>
        }
        <div className="esper-subsection-footer">
          <a onClick={this.editCalendars.bind(this)}>
            <i className="fa fa-fw fa-calendar-check-o" />{" "}
            Add / Remove Calendars
          </a>
        </div>
      </BorderlessSection>;
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
      Layout.renderModal(<CalAddModal onHidden={() => {
        if (!this.props.selected.length || !this.props.selected[0].calId) {
          Option.cast(Calendars.defaultSelection()).match({
            none: () => null,
            some: (d) => this.props.updateFn([d])
          });
        }
      }} />);
    }
  }
}
