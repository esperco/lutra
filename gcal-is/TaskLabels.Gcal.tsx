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

      // Make call to server
      var teamId = this.props.team.teamid;
      CurrentEvent.getTask()
        .then(function(task) {
          var promise = putLabels(task.taskid, teamId, labels);

          /*
            If we get a promise back, that means there were no prior pending
            calls and we should attach a promise to handle saves completing
          */
          if (promise) { // No existing call, set up post handlers
            promise.done(function() {
              // No longer busy
              CurrentEvent.taskStore.set(function(data, metadata) {
                metadata = _.clone(metadata);
                metadata.dataStatus = Model.DataStatus.READY;
                return [data, metadata];
              });
            });
          }
        })
    }
  }
}