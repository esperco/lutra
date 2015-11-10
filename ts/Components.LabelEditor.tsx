/*
  Component for updating labels for a given task
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/TaskLabels.tsx" />
/// <reference path="../marten/ts/ApiC.ts" />
/// <reference path="./Teams.ts" />

module Esper.Components {
  /*
    Secondary store to use for newly created tasks while we're waiting for it
    to save. We would normally use the store associated with out API call,
    but that returns a task list rather than a single task, so it's a bit
    more complicated and just easier to check a secondary source.

    Use primary API store for dataStatus-related queries.
  */
  var newTaskStore = new Model.CappedStore<ApiT.NewTask>();

  // Use combination of teamId, calId, and eventId to save
  function newTaskKey(teamId: string, calId: string, eventId: string) {
    return [teamId, calId, eventId].join(" ");
  }

  function getNewTask(teamId: string, calId: string, eventId: string) {
    var key = newTaskKey(teamId, calId, eventId);
    return newTaskStore.val(key);
  }

  function setNewTask(teamId: string, calId: string, eventId: string,
    data: ApiT.NewTask)
  {
    var key = newTaskKey(teamId, calId, eventId);
    newTaskStore.upsert(key, data);
  }


  ///////

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LabelEditorProps {
    // Selected team, calendar, and event
    teamId: string;
    calId: string;
    eventId: string;
    eventTitle?: string;
  }

  interface LabelEditorState {
    task?: ApiT.Task|ApiT.NewTask;
    dataStatus?: Model.DataStatus;
  }

  export class LabelEditor
    extends Component<LabelEditorProps, LabelEditorState>
  {
    render() {
      return <div className="esper-borderless-section">
        <h4 className="esper-header">
          <i className="fa fa-fw fa-tags"></i>{" "}
          Select Labels
        </h4>
        <div className="esper-content">
          <h5 className="esper-subheader">{this.props.eventTitle}</h5>
          { this.renderContent() }
        </div>
      </div>;
    }

    renderContent() {
      if (this.state.dataStatus === Model.DataStatus.FETCHING) {
        return <div className="esper-spinner esper-medium"></div>;
      }

      if (this.state.dataStatus === Model.DataStatus.PUSH_ERROR ||
          this.state.dataStatus === Model.DataStatus.FETCH_ERROR) {
        return <div className="alert alert-danger">
          <i className="fa fa-fw fa-warning" />{" "}
          Whoops. Something went wrong. Please try again later.
        </div>;
      }

      return <TaskLabels.LabelList
        listClasses="list-group"
        itemClasses="list-group-item"
        team={Teams.get(this.props.teamId)}
        task={this.state.task}
        busy={this.state.dataStatus === Model.DataStatus.INFLIGHT}
        handleChange={this.handleLabelChange.bind(this)}
      />;
    }

    componentDidMount() {
      this.setSources([
        ApiC.getTaskListForEvent.store,
        newTaskStore
      ]);
    }

    getStoreKey() {
      return ApiC.getTaskListForEvent.strFunc(
        [this.props.eventId, false, false]);
    }

    getState(props: LabelEditorProps): LabelEditorState {
      var store = ApiC.getTaskListForEvent.store;
      var keyStr = this.getStoreKey();
      var metadata = store.metadata(keyStr);
      var dataStatus = metadata && metadata.dataStatus;
      if (dataStatus === undefined) {
        dataStatus = Model.DataStatus.READY
      }

      var task: ApiT.Task|ApiT.NewTask = metadata &&
        _.find(store.val(keyStr), (t) => {
          return t.task_teamid === this.props.teamId
        });

      // Check if pre-existing NewTask
      task = task || getNewTask(this.props.teamId, this.props.calId,
                                this.props.eventId);

      // Create NewTask object if not task
      task = task || {
        task_title: this.props.eventTitle,
        task_progress: "In_progress"
      };

      return {
        task: task,
        dataStatus: dataStatus
      };
    }

    // TODO: Rewrite this function when we remove task requirement for labels
    handleLabelChange(labels: string[]) {
      // Mark as busy, update our local source of truth
      var key = this.getStoreKey();
      var store = ApiC.getTaskListForEvent.store;
      var task = this.state.task;
      var hasTaskId = false;
      if (!! ((task as ApiT.Task).taskid)) {
        hasTaskId = true;
        store.upsert(key, (taskList, meta) => {
          taskList = _.cloneDeep(taskList);
          task = _.find(taskList, (t) => {
            return t.task_teamid === this.props.teamId
          });
          task.task_labels = labels;

          var meta = _.clone(meta) || {};
          meta.dataStatus = Model.DataStatus.INFLIGHT;

          return [taskList, meta];
        });
      }
      else {
        task = _.cloneDeep(task) as ApiT.NewTask;
        task.task_labels = labels;
        setNewTask(this.props.teamId,
          this.props.calId,
          this.props.eventId,
          task);
      }

      // Get a promise that resolves to a task
      var p: JQueryPromise<ApiT.Task>;
      if (hasTaskId) {
        p = $.Deferred<ApiT.Task>()
             .resolve(task as ApiT.Task)
             .promise();
      } else {
        p = Api.obtainTaskForEvent(
          this.props.teamId,
          this.props.calId,
          this.props.eventId,
          task, false, false
        );
      }

      // Create task after getting a taskId
      p.then((task) => {
        var promise = TaskLabels.putLabels(task.taskid,
          this.props.teamId, labels);

        /*
          If we get a promise back, that means there were no prior pending
          calls and we should pass along the promise with a bool indicating
          we should update save status when it's complete. Otherwise, pass
          along false to signal that we should ignore / defer to the callback
          on the earlier promise.
        */
        if (promise) { // No existing call, set up post handlers
          return promise.then(() => true);
        } else {
          return false;
        }
      })

      .then((update: boolean) => {
        if (update) {
          store.upsert(key, (taskList, meta) => {
            var meta = _.clone(meta) || {};
            meta.dataStatus = Model.DataStatus.READY;
            return [taskList, meta];
          });
        }
      }, (err: Error) => {
        store.upsert(key, (taskList, meta) => {
          var meta = _.clone(meta) || {};
          meta.dataStatus = Model.DataStatus.PUSH_ERROR;
          meta.lastError = err;
          return [taskList, meta];
        });
      });
    }
  }
}
