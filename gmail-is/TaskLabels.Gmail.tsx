/*
  Code for making displaying task labels work in Gmail
*/

/// <reference path="../common/TaskLabels.tsx" />
/// <reference path="./CurrentThread.ts" />

module Esper.TaskLabels {
  // Sort of annoying but needed to make namespaced React work with JSX
  var React = Esper.React;

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LabelListControlState {
    team: ApiT.Team;
    task: ApiT.Task;
    busy: boolean;
  }

  // TODO -- Refactor more against calendar version of this
  export class LabelListControl
    extends Component<{}, LabelListControlState>
  {
    /*
      In order to avoid race conditions, we wait until the last update is
      done until we send the next one. Since we're sending over the entire
      set of labels we only need to store the next immediate update to send.
    */
    nextUpdate: string[];
    callInProgress: JQueryPromise<any>;

    render() {
      return <TaskLabels.LabelList
        team={this.state.team}
        task={this.state.task}
        busy={this.state.busy}
        handleChange={this.handleLabelChange.bind(this)} />
    }

    handleLabelChange(labels: string[]) {
      // If there is an in-progress update, just piggy back off of that
      this.nextUpdate = labels;

      // Start a request if none in progress
      if (!this.callInProgress || this.callInProgress.state() !== "pending") {
        this.saveToServer();
      }
    }

    // Makes actual calls to server
    // TODO: Move this out of component so we don't get warning about setting
    // the state of an unmounted component
    saveToServer() {
      this.makeBusy();
      if (this.nextUpdate) {
        var teamId = this.state.team.teamid;
        var labels = this.nextUpdate;
        this.callInProgress = CurrentThread.getTaskForThread()
          .then(function(task) {
            return Api.setTaskLabels(teamId, task.taskid, labels);
          });

        // Delete nextUpdate so callback doesn't re-trigger
        delete this.nextUpdate;

        // Once call is done, re-check
        this.callInProgress.done(this.saveToServer.bind(this));
      } else {
        this.unmakeBusy();
      }
    }

    getState() {
      return {
        team: CurrentThread.currentTeam.get().unwrap(""),
        task: CurrentThread.task.get(),
        busy: (this.state && this.state.busy) || false
      };
    }

    makeBusy() {
      var newState = _.extend(this.state || {},
        { busy: true }) as LabelListControlState;
      this.setState(newState);
    }

    unmakeBusy() {
      var newState = _.extend(this.state || {},
        { busy: false }) as LabelListControlState;
      this.setState(newState);
    }
  }
}