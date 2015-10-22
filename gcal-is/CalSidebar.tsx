/*
  Calendar sidebar (differs a bit from Gmail sidebar)
*/

/// <reference path="../marten/typings/bootstrap/bootstrap.d.ts" />
/// <reference path="../marten/ts/Model.Capped.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/JQStore.ts" />
/// <reference path="../common/Api.ts" />
/// <reference path="../common/Teams.ts" />
/// <reference path="../common/ExtensionOptions.Model.ts" />
/// <reference path="./TaskLabels.Gcal.tsx" />
/// <reference path="./CurrentEvent.ts" />

module Esper.CalSidebar {
  // Sort of annoying but needed to make namespaced React work with JSX
  var React = Esper.React;

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  /*
    Store references to jQuery element for anchor point -- this is set when the
    render function is called and get cleared once the anchor element is
    removed from the DOM.
  */
  var anchorPoint = new JQStore();

  // Gets, sets, and stores anchor point for sidebar. Then renders
  // our React sidebar in it.
  function getAnchorPoint() {
    var ret = anchorPoint.get();
    if (! ret) {
      ret = $(`<div id="esper" class="esper esper-bs esper-cal-sidebar" />`);
      $("body").append(ret);
      anchorPoint.set(ret);
    }
    return ret;
  }


  //////

  // Track sidebar min/max state by eventId
  var cap = 100;
  var sidebarStateStore = new
    Model.CappedStore<ExtensionOptions.SidebarOpts>(cap);

  function stringifyEventId(fullEventId: Types.FullEventId) {
    return fullEventId.calendarId + " " + fullEventId.eventId;
  }

  function getSidebarState(fullEventId: Types.FullEventId) {
    var _id = fullEventId && stringifyEventId(fullEventId);
    var ret = _id && sidebarStateStore.val(_id);
    if (_.isUndefined(ret)) {
      var opts = ExtensionOptions.store.val();
      ret = (opts ? opts.calendarSidebarState :
             ExtensionOptions.SidebarOpts.SHOW);
    }
    return ret;
  }

  function setSidebarState(fullEventId: Types.FullEventId,
                           state: ExtensionOptions.SidebarOpts) {
    var _id = stringifyEventId(fullEventId);
    sidebarStateStore.set(_id, state);
  }

  /*
    List of 2-tuples from stringified eventIds to sidebar state, as formmated
    for local storage
  */
  type EventSidebarData = Array<[string, ExtensionOptions.SidebarOpts]>;

  // Var we can toggle to keep listener from posting changes to Content Script
  var quietSidebarChanges = false;

  // Change listener that posts thread state to Content Script
  var storeSidebarChanges = function(_ids: string[]) {
    if (!quietSidebarChanges) {
      Message.post(Message.Type.EventStateUpdate, _.map(_ids, function(_id) {
        return [_id, sidebarStateStore.val(_id)];
      }));
    }
  };


  //////

  interface SidebarAttrs {
    eventId: Types.FullEventId;
    sidebarState: ExtensionOptions.SidebarOpts;
    task: ApiT.Task|ApiT.NewTask;
    taskMetadata: Model.StoreMetadata;
    team: ApiT.Team;
  }

  class SidebarAndDock extends Component<{}, SidebarAttrs> {
    render() {
      if (Login.loggedIn() && this.state.eventId &&
          this.state.sidebarState !== ExtensionOptions.SidebarOpts.NONE) {
        return (<div>
          <Sidebar
            eventId={this.state.eventId}
            task={this.state.task}
            taskMetadata={this.state.taskMetadata}
            team={this.state.team}
            sidebarState={this.state.sidebarState} />
          <Dock
            eventId={this.state.eventId}
            task={this.state.task}
            taskMetadata={this.state.taskMetadata}
            team={this.state.team}
            sidebarState={this.state.sidebarState} />
        </div>);
      }

      // No event (don't render)
      // TODO: Render something for new events
      else {
        return <span></span>;
      }
    }

    componentDidMount() {
      // This ensures our sidebar gets updated if eventId or task changes
      this.setSources([
        ExtensionOptions.store,
        CurrentEvent.eventIdStore,
        CurrentEvent.teamStore,
        CurrentEvent.taskStore,
        sidebarStateStore
      ]);

      // Ensures sidebar is updated after logging in
      Login.onLogin(this.onChange);
    }

    getState() {
      var eventId = CurrentEvent.eventIdStore.val();
      var task = CurrentEvent.taskStore.val();
      var taskMetadata = CurrentEvent.taskStore.metadata();
      var team = CurrentEvent.teamStore.val();

      var sidebarState: ExtensionOptions.SidebarOpts;
      var optState = ExtensionOptions.store.val();
      if (optState && (
          optState.calendarSidebarState ===
            ExtensionOptions.SidebarOpts.SHOW ||
          optState.calendarSidebarState ===
            ExtensionOptions.SidebarOpts.HIDE)) {
        sidebarState = getSidebarState(eventId);
      } else {
        sidebarState = ExtensionOptions.SidebarOpts.NONE;
      }

      return {
        eventId: eventId,
        task: task,
        taskMetadata: taskMetadata,
        team: team,
        sidebarState: sidebarState
      };
    }
  }


  class Sidebar extends Component<SidebarAttrs, {}> {
    render() {
      var showLoading = (!this.props.task && this.props.taskMetadata &&
        this.props.taskMetadata.dataStatus === Model.DataStatus.FETCHING);

      var showSidebar = (this.props.team &&
        this.props.sidebarState === ExtensionOptions.SidebarOpts.SHOW);
      return (<div className={"esper-sidebar esper-sidebar-simple " +
                              (showSidebar ? "" : "esper-hide")}>
        {
          showLoading ?
          <div className="esper-spinner esper-sidebar-spinner"></div> :
          (
            this.props.team ?
            <TaskLabels.LabelListControl
              team={this.props.team}
              task={this.props.task}
              taskMetadata={this.props.taskMetadata}
              eventId={this.props.eventId} /> : ""
          )
        }
      </div>);
    }
  }


  class Dock extends Component<SidebarAttrs, {}> {
    render() {
      var teamName: JSX.Element;
      var loading: boolean;
      if (this.props.team) {
        teamName = (<span>{this.props.team.team_name}</span>);
      }
      else if (this.props.taskMetadata &&
          this.props.taskMetadata.dataStatus === Model.DataStatus.FETCHING) {
        loading = true;
        teamName = (<span className="esper-dock-loading">
          Loading &hellip;
        </span>);
      } else {
        teamName = (<span className="esper-unknown-team">Unknown Team</span>);
      }
      var showWrap = (this.props.team &&
        this.props.sidebarState === ExtensionOptions.SidebarOpts.SHOW);

      return (<div className="esper-dock-container">
        <div className={"esper-dock-wrap " + (showWrap ? "" : "esper-hide")}>
          <div className="esper-dock-wrap-left" />
          <div className="esper-dock-wrap-right" />
        </div>
        <div className="esper-dock">
          {
            loading ? "" :
            <DockMenu
              selectedTeamId={this.props.team && this.props.team.teamid} />
          }
          <div className="esper-team-name">{teamName}</div>
          <div className="esper-dock-action esper-size"
               onClick={this.toggleSidebar.bind(this)}>
            <div className={"esper-dock-action-icon esper-size-icon " +
                            (showWrap ? "" : "esper-minimize")} />
          </div>
        </div>
      </div>);
    }

    toggleSidebar() {
      if (this.props.eventId) {
        var nextState = (
          this.props.sidebarState === ExtensionOptions.SidebarOpts.HIDE ?
            ExtensionOptions.SidebarOpts.SHOW :
            ExtensionOptions.SidebarOpts.HIDE);
        setSidebarState(this.props.eventId, nextState);
      }
    }
  }


  interface DockMenuProps {
    selectedTeamId: string;
  }

  class DockMenu extends Component<DockMenuProps, {}> {
    render() {
      // Create list elements for each team
      var selectedTeamId = this.props.selectedTeamId;
      var teamElms = _.map(Login.myTeams(), function(team) {
        var profile = Teams.getProfile(team.team_executive);
        var email = profile && profile.email;
        var selected = team.teamid === selectedTeamId;
        function selectTeam() {
          CurrentEvent.setTeam(team);
        }

        return (<li className={"esper-li " +
                               (selected ? "esper-selected" : "")}
                    key={team.teamid}
                    onClick={selected ? null : selectTeam}>
          {selected ?
            <object className="esper-svg esper-team-checkmark"
              data={Init.esperRootUrl + "img/check.svg"} />
            : ""}
          <div className="esper-click-safe">
            {team.team_name}
          </div>
          <div className="esper-team-exec-email">
            {email || "Unknown Email"}
          </div>
        </li>);
      });

      return (<div className="dropup">
        <div className={"esper-dock-action " +
          "esper-dropdown-btn esper-options"}
          data-toggle="dropdown">
          <div className={"esper-dock-action-icon " +
            "esper-options-icon"} />
        </div>
        <ul className="dropdown-menu">
          <li className={"esper-li esper-bold " +
                         "esper-disabled esper-team-list-title"}>
            Users
          </li>
          {teamElms}
          <li role="separator" className="divider"></li>
          <li className="esper-li" onClick={this.openSettings}>Settings</li>
          <li className="esper-li" onClick={this.openHelp}>Help</li>
          <li className="esper-li esper-danger"
              onClick={Login.logout}>Sign out</li>

          <li role="separator" className="divider"></li>
          <li className="esper-dropdown-section esper-dropdown-footer">
            <object data={Init.esperRootUrl + "img/footer-logo.svg"}
              className="esper-svg esper-dropdown-footer-logo" />
            <div className="esper-dropdown-footer-links">
              <a target="_blank" href="http://esper.com/privacypolicy.html">
                Privacy</a>
              <div className="esper-dropdown-footer-divider" />
              <a target="_blank" href="http://esper.com/termsofuse.html">
                Terms</a>
              <div className="esper-dropdown-footer-divider" />
              <span className="esper-copyright">
                &copy; 2015 Esper
              </span>
            </div>
          </li>
        </ul>
      </div>);
    }

    componentDidMount() {
      this.find(".esper-dropdown-btn").dropdown();
    }

    openSettings() {
      window.open(Conf.Api.url);
    }

    openHelp() {
      window.open("http://esper.com/contact")
    }
  }


  //////

  // Actual rendering function
  function render() {
    var anchorPoint = getAnchorPoint();
    if (anchorPoint.is(":empty")) {
      anchorPoint.renderReact(React.createElement(SidebarAndDock, {}));
    }
  }

  export function init() {
    // Add our post-to-CS listener
    sidebarStateStore.addChangeListener(storeSidebarChanges);

    // Update options based on value from posted messages from Content Script
    Message.listen(Message.Type.EventStateData,
      function(data: EventSidebarData) {

        // Silence listener while initializing
        quietSidebarChanges = true;

        _.each(data, function(datum) {
          var _id = datum[0];
          var state = datum[1];

          // Don't override existing local state
          if (!sidebarStateStore.has(_id)) {
            sidebarStateStore.insert(_id, state);
          }
        });

        quietSidebarChanges = false;
      });

    // Post initial request for data (response handled by listener above)
    Message.post(Message.Type.RequestEventState);


    /*
      Render on init -- we may want to tie the render function to some sort
      of watcher later to ensure our anchor point gets re-added if necessary,
      but it seems fine for now
    */
    render();
  }
}