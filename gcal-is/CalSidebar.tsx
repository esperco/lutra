/*
  Calendar sidebar (differs a bit from Gmail sidebar)
*/

/// <reference path="../marten/typings/bootstrap/bootstrap.d.ts" />
/// <reference path="../marten/ts/Model.Capped.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/JQStore.ts" />
/// <reference path="../common/Api.ts" />
/// <reference path="../common/Teams.ts" />
/// <reference path="../common/TaskLabels.tsx" />
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
  enum SidebarState { HIDE, SHOW };
  var sidebarStateStore = new Model.CappedStore<SidebarState>();

  function stringifyEventId(fullEventId: Types.FullEventId) {
    return fullEventId.calendarId + " " + fullEventId.eventId;
  }

  function getSidebarState(fullEventId: Types.FullEventId) {
    var _id = fullEventId && stringifyEventId(fullEventId);
    var ret = _id && sidebarStateStore.val(_id);
    if (_.isUndefined(ret)) {
      return SidebarState.SHOW; // Default (TODO: Defer to options)
    }
    return ret;
  }

  function setSidebarState(fullEventId: Types.FullEventId,
                           state: SidebarState) {
    var _id = stringifyEventId(fullEventId);
    sidebarStateStore.set(_id, state);
  }


  //////

  interface SidebarAttrs {
    eventId: Types.FullEventId;
    sidebarState: SidebarState;
    task: ApiT.Task|ApiT.NewTask;
    taskMetadata: Model.StoreMetadata;
    team: ApiT.Team;
  }

  class SidebarAndDock extends Component<{}, SidebarAttrs> {
    render() {
      if (Login.loggedIn() && this.state.eventId &&
          Teams.initialize().state() === "resolved") {
        return (<div>
          {
            this.state.team ?
            <Sidebar
              eventId={this.state.eventId}
              task={this.state.task}
              taskMetadata={this.state.taskMetadata}
              team={this.state.team}
              sidebarState={this.state.sidebarState} /> :
            ""
          }
          <Dock
            eventId={this.state.eventId}
            task={this.state.task}
            taskMetadata={this.state.taskMetadata}
            team={this.state.team}
            sidebarState={this.state.sidebarState} />
        </div>);
      }

      // TODO: Show "busy" indicator if we're still loading profile info
      // or teams

      // No event (don't render)
      // TODO: Render something for new events
      else {
        return <span></span>;
      }
    }

    componentDidMount() {
      // This ensures our sidebar gets updated if eventId or task changes
      this.setSources([
        CurrentEvent.eventIdStore,
        CurrentEvent.teamStore,
        CurrentEvent.taskStore,
        sidebarStateStore
      ]);
    }

    getState() {
      var eventId = CurrentEvent.eventIdStore.val();
      var task = CurrentEvent.taskStore.val();
      var taskMetadata = CurrentEvent.taskStore.metadata();
      var team = CurrentEvent.teamStore.val();
      var sidebarState = getSidebarState(eventId);
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
      var showSidebar = this.props.sidebarState === SidebarState.SHOW;
      return (<div className={"esper-sidebar esper-sidebar-simple " +
                              (showSidebar ? "" : "esper-hide")}>
        <div className="esper-subheading">
          <i className="fa fa-fw fa-tag"></i>
          {" "} Labels
        </div>
        <LabelListControl
          team={this.props.team}
          task={this.props.task}
          taskMetadata={this.props.taskMetadata}
          eventId={this.props.eventId}
          sidebarState={this.props.sidebarState} />
      </div>);
    }
  }


  class LabelListControl extends Component<SidebarAttrs, {}> {
    /*
      In order to avoid race conditions, we wait until the last update is
      done until we send the next one. Since we're sending over the entire
      set of labels we only need to store the next immediate update to send.
    */
    nextUpdate: string[];
    callInProgress: JQueryPromise<any>;

    render() {
      return <TaskLabels.LabelList
        team={this.props.team}
        task={this.props.task}
        busy={this.props.taskMetadata &&
              this.props.taskMetadata.dataStatus === Model.DataStatus.INFLIGHT}
        handleChange={this.handleLabelChange.bind(this) } />
    }

    handleLabelChange(labels: string[]) {
      // If there is an in-progress update, just piggy back off of that
      this.nextUpdate = labels;

      // Mark as busy, update our local source of truth
      CurrentEvent.taskStore.set(function(data, metadata) {
        if (data) {
          data = _.clone(data);
          data.task_labels = labels;
        } else {
          // Store as NewTask
          data = {
            task_title: Esper.Gcal.Event.extractEventTitle(),
            task_labels: labels
          };
        }
        metadata = _.clone(metadata) || {};
        metadata.dataStatus = Model.DataStatus.INFLIGHT;
        return [data, metadata];
      });

      // Start a request if none in progress
      if (!this.callInProgress || this.callInProgress.state() !== "pending") {
        this.saveToServer();
      }
    }

    // Makes actual calls to server
    // TODO: Move this out of component so we don't get warning about setting
    // the state of an unmounted component
    saveToServer() {
      if (this.nextUpdate) {
        var teamId = this.props.team.teamid;
        var labels = this.nextUpdate;
        this.callInProgress = this.getTask()
          .then(function(task) {
            return Api.setTaskLabels(teamId, task.taskid, labels);
          });

        // Delete nextUpdate so callback doesn't re-trigger
        delete this.nextUpdate;

        // Once call is done, re-check
        this.callInProgress.done(this.saveToServer.bind(this));
      } else {
        // No longer busy
        CurrentEvent.taskStore.set(function(data, metadata) {
          metadata = _.clone(metadata);
          metadata.dataStatus = Model.DataStatus.READY;
          return [data, metadata];
        });
      }
    }

    // Returns promise to resolves to task
    getTask(): JQueryPromise<ApiT.Task> {
      if (this.props.task) {
        return Promise.defer(this.props.task);
      } else {
        return Api.obtainTaskForEvent(
          this.props.team.teamid,
          this.props.eventId.calendarId,
          this.props.eventId.eventId,
          { task_title: Esper.Gcal.Event.extractEventTitle() },
          false, false
        ).then(function(task) {
          /*
            Update local source of truth with new task but conform
            task labels to next update so user doesn't see flicker
            of checkmarks while we're updating.
          */
          CurrentEvent.taskStore.set(function(oldTask) {
            if (oldTask && oldTask.task_labels) {
              task.task_labels = oldTask.task_labels;
            }
            return task as ApiT.Task;
          });
          return task;
        });
      }
    }
  }


  class Dock extends Component<SidebarAttrs, {}> {
    render() {
      var teamName = (this.props.team ?
        <span>{this.props.team.team_name}</span> :
        <span className="esper-unknown-team">Unknown Team</span>);
      var showWrap = this.props.sidebarState === SidebarState.SHOW;

      return (<div className="esper-dock-container">
        <div className={"esper-dock-wrap " + (showWrap ? "" : "esper-hide")}>
          <div className="esper-dock-wrap-left" />
          <div className="esper-dock-wrap-right" />
        </div>
        <div className="esper-dock">
          <DockMenu
            selectedTeamId={this.props.team && this.props.team.teamid} />

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
        var nextState = (this.props.sidebarState === SidebarState.HIDE ?
          SidebarState.SHOW : SidebarState.HIDE);
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
    /*
      Render on init -- we may want to tie the render function to some sort
      of watcher later to ensure our anchor point gets re-added if necessary,
      but it seems fine for now
    */
    render();
  }
}