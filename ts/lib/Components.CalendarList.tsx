/*
  A list of calendars, for selection purposes
*/

/// <reference path="./Actions.Calendars.ts" />
/// <reference path="./Components.ListSelector.tsx" />
/// <reference path="./Components.Modal.tsx" />

module Esper.Components {
  interface Props {
    team: ApiT.Team;
    selectedCalendars: ApiT.GenericCalendar[];
    availableCalendars: ApiT.GenericCalendar[];

    onCalendarLimit?: () => any;
    limit?: number;
    className?: string;
    listClasses?: string;
    itemClasses?: string;
    selectedItemClasses?: string;
  }

  export class CalendarList extends ReactHelpers.Component<Props, {
    hasError?: boolean;
  }> {
    constructor(props: Props) {
      super(props);
      this.state = { hasError: false };
    }

    componentWillReceiveProps(newProps: Props) {
      if (!_.isEmpty(newProps.selectedCalendars)) {
        this.setState({ hasError: false });
      }
    }

    render() {
      var calendars = this.props.availableCalendars;
      var teamApproved = this.props.team.team_approved &&
        !!this.props.team.team_timestats_calendars.length;
      var isExec = Login.myUid() === this.props.team.team_executive;

      var calChoices = _.map(calendars, (c) => ({
        id: c.id,
        displayAs: c.title
      }));
      var calSelected = _.map(this.props.selectedCalendars, (c) => c.id);

      return <div className={this.props.className}>
        { this.state.hasError ?
          ( calendars && calendars.length ?
            <div className="alert alert-danger">
              { Text.MustSelectCalendar }
            </div> : <div className="alert alert-info">
              { Text.NoCalendarError }
            </div>
          ) : null
        }

        { (Login.usesNylas() && !isExec && !teamApproved) ?

          // Not approved or no calendars shared
          <div className="esper-no-content">
            Waiting for calendar owner to grant access.
          </div> :

          // Approved (or not Nylas)
          ( calendars && calendars.length ?

            <ListSelectorSimple
              choices={calChoices}
              selectedIds={calSelected}

              selectOption={ListSelectOptions.MULTI_SELECT}
              selectedIcon="fa-calendar-check-o"
              unselectedIcon="fa-calendar-o"

              listClasses={this.props.listClasses}
              itemClasses={this.props.itemClasses}
              selectedItemClasses={this.props.selectedItemClasses}

              updateFn={(ids) => this.update(ids)}
            /> :

            // No calendars
            <div className="esper-no-content">
              No calendars found.{" "}
              { Login.usesNylas() ?
                <span>
                  It may take a few minutes for your calendar provider
                  to sync with Esper. Please try{" "}
                  <a onClick={() => location.reload()}>
                    refreshing the page
                  </a>
                  {" "}in a few minutes.
                </span> : null }
            </div>
          )
        }
      </div>;
    }

    update(ids: string[]) {
      if (this.props.limit !== undefined &&
          ids.length > this.props.limit &&
          ids.length > this.props.selectedCalendars.length &&
          this.props.onCalendarLimit) {
        this.props.onCalendarLimit();
        return;
      }
      // Join all cals -> prioritize selected cals over available because
      // there may be settings and things tied to the selected ones
      var cals = _.unionBy(
        this.props.selectedCalendars,
        this.props.availableCalendars,
        (c) => c.id
      );
      cals = _.filter(cals, (c) => _.includes(ids, c.id))
      Actions.Calendars.update(this.props.team.teamid, cals);
    }

    // Since clicking automatically triggers an action, validation doesn't
    // do anything other than show an error message if no calendars selected
    validate() {
      // If no available calendars, don't hold up validation
      if (_.isEmpty(this.props.availableCalendars)) {
        return Option.some<ApiT.GenericCalendar[]>([]);
      }

      if (!_.isEmpty(this.props.selectedCalendars)) {
        return Option.some(this.props.selectedCalendars);
      } else {
        this.mutateState((s) => s.hasError = true);
        return Option.none<ApiT.GenericCalendar[]>();
      }
    }
  }

  ///

  export class CalendarListModal extends ReactHelpers.Component<Props & {
    title: string;
    isBusy?: boolean;
    hasError?: boolean;
  }, {}> {
    render() {
      return <Modal icon="fa-calendar-o" title={this.props.title}>
        { this.props.isBusy ? <div className="esper-spinner" /> : null }

        { this.props.hasError ? <ErrorMsg /> : null }

        { React.createElement(CalendarList, this.props) }
      </Modal>;
    }
  }

}
