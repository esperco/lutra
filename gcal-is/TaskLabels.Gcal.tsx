/*
  Calendar-specific implentation of TaskLabels widget
*/

/// <reference path="../common/TaskLabels.tsx" />
/// <reference path="./CurrentEvent.ts" />

module Esper.TaskLabels {
  // Sort of annoying but needed to make namespaced React work with JSX
  var React = Esper.React;

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LabelListControlProps {
    team: ApiT.Team;
    task: ApiT.Task|ApiT.NewTask;
    taskMetadata: Model.StoreMetadata;
    eventId: Types.FullEventId;
  }

  export class LabelListControl extends Component<LabelListControlProps, {}> {
    /*
      In order to avoid race conditions, we wait until the last update is
      done until we send the next one. Since we're sending over the entire
      set of labels we only need to store the next immediate update to send.
    */
    nextUpdate: string[];
    callInProgress: JQueryPromise<any>;

    render() {
      var updating = this.props.taskMetadata &&
        this.props.taskMetadata.dataStatus === Model.DataStatus.FETCHING;
      var saving = this.props.taskMetadata &&
        this.props.taskMetadata.dataStatus === Model.DataStatus.INFLIGHT;

      return (<div>
        <div className="esper-subheading">
          <i className="fa fa-fw fa-tag" />
          {" "} Labels
          <i onClick={ this.refresh.bind(this) }
             className="fa fa-fw fa-refresh" />
        </div>
        { updating ?
          <div className="esper-sidebar-loading">
            <div className="esper-spinner esper-list-spinner"></div>
          </div> :
          <TaskLabels.LabelList
            team={this.props.team}
            task={this.props.task}
            busy={saving}
            handleChange={this.handleLabelChange.bind(this) } />
        }
      </div>);
    }

    // Update current task (and by extension, the labels)
    refresh() {
      CurrentEvent.refreshTask();
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
        this.callInProgress = CurrentEvent.getTask()
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
  }
}