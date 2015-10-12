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
      // Update local state to reflect checkbox changes
      this.setState(function(prevState) {
        var state = _.clone(prevState); // For immutability purposes
        state.task = _.clone(state.task);
        state.task.task_labels = labels;
        return state;
      });

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
      this.setState(function(prevState) {
        var state = _.clone(prevState); // For immutability purposes
        state.busy = true;
        return state;
      });
    }

    unmakeBusy() {
      this.setState(function(prevState) {
        var state = _.clone(prevState); // For immutability purposes
        state.busy = false;
        return state;
      });
    }

    /*
      Because state is dependent on current task, set watcher to re-render
      when CurrentThread.task changes. We store reference to watcher to
      de-reference when component is unmounted.
    */
    taskWatcherId: string;

    componentDidMount() {
      this.taskWatcherId = CurrentThread.task.watch(this.onChange);
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      if (this.taskWatcherId) {
        CurrentThread.task.unwatch(this.taskWatcherId);
      }
    }
  }
}