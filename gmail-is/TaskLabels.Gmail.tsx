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
    render() {
      return <TaskLabels.LabelList
        team={this.state.team}
        task={this.state.task}
        busy={this.state.busy}
        handleChange={this.handleLabelChange.bind(this)} />
    }

    handleLabelChange(labels: string[]) {
      // Update local state to reflect checkbox changes and set to busy
      this.setState(function(prevState) {
        var state = _.clone(prevState); // For immutability purposes
        state.task = _.clone(state.task);
        state.task.task_labels = labels;
        state.busy = true;
        return state;
      });

      // Make actual call to server
      var self = this;
      CurrentThread.getTaskForThread()
        .then(function(task) {
          var promise = putLabels(task.taskid, self.state.team.teamid, labels);

          /*
             If we get a promise back, that means there were no prior pending
             calls and we should attach a promise to handle saves completing
           */
          if (promise) { // No existing call, set up post handlers
            promise.done(self.unmakeBusy.bind(self));
          }
        });
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