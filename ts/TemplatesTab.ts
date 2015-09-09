/*
  Team Settings - Templates Tab
*/

module TemplatesTab {

  interface WorkflowView {
    title: JQuery;
    notes: JQuery;
  }

  function saveChanges(team: ApiT.Team,
                       wf: ApiT.Workflow,
                       wfv: WorkflowView,
                       s: ApiT.WorkflowStep,
                       sv: StepView): JQueryPromise<void> {
    var newTitle = wfv.title.val();
    if (newTitle.length > 0) wf.title = newTitle;
    wf.notes = wfv.notes.val();

    if (s) { // Are we editing a step?
      var step = List.find(wf.steps, function(x) {
        return x.id === s.id;
      });

      var newStepTitle = sv.title.val();
      if (newStepTitle.length > 0) step.title = newStepTitle;
      step.notes = sv.notes.val();

      var newChecklist = [];
      sv.checklist.find("input:text").each(function() {
        var input = $(this).val();
        if (input.length > 0) {
          newChecklist.push({ text: input, checked: false });
        }
      });
      step.checklist = newChecklist;
    }

    return Api.updateWorkflow(team.teamid, wf.id, wf);
  }

  function viewOfWorkflow(team: ApiT.Team,
                          wf: ApiT.Workflow,
                          prefs: ApiT.Preferences,
                          tabContainer: JQuery) {
'''
<div #view>
  <div class="bottom-gap top-gap">
    <label>Title:</label>
    <input type="text" #title size=40/>
  </div>
  <div>
    <label>Notes:</label>
    <textarea #notes class="workflow-notes" rows=8
                     placeholder="General notes for the workflow"/>
  </div>
  <button class="button-primary" #save>Save Workflow</button>
  <button class="button-secondary" #cancel>Cancel</button>
</div>
'''

    title.val(wf.title);
    if (wf.notes.length > 0) notes.val(wf.notes);

    function reload() {
      tabContainer.children().remove();
      tabContainer.append(load(team, tabContainer));
    }

    save.click(function() {
      var wfv = <WorkflowView> _view;
      saveChanges(team, wf, wfv, currentStep, currentStepView).done(reload);
    });

    cancel.click(reload);

    return view;
  }

  export function load(team : ApiT.Team, tabContainer) {
'''
<div #view>
  <div #edit class="bottom-gap top-gap" >
    Choose an existing workflow to edit:
    <select class="esper-select" style= "float: none" #editDropdown>
      <option value="header">Select workflow...</option>
    </select>
  </div>
  <div #create>
    <input #createTitle type="text" size=40 placeholder="Template title" />
    <button class="button-primary" #createButton> Create Template</button>
  </div>
  <div #workflow>
    <big #nowEditing/>
  </div>
</div>
'''
    Api.getPreferences(team.teamid).done(function(prefs) {
      var preferences = $.extend(true, Preferences.defaultPreferences(), prefs);

      Api.listWorkflows(team.teamid).done(function(response) {
        if (response.workflows.length > 0) {
          var wfById: { [wfid: string]: ApiT.Workflow } = {};
          List.iter(response.workflows, function(wf) {
            var opt = ("<option value='" + wf.id + "'>" + wf.title + "</option>");
            wfById[wf.id] = wf;
            editDropdown.append(opt);
          });
          editDropdown.change(function() {
            var chosen = $(this).val();
            if (chosen !== "header") {
              var wf = wfById[chosen];
              edit.hide();
              create.hide();
              nowEditing.text("Editing workflow: " + wf.title);
              workflow.append(viewOfWorkflow(team, wf, preferences, tabContainer));
            }
          });
        } else {
          editDropdown.replaceWith($("<i>(No current workflows)</i>"));
        }
      });

      createButton.click(function() {
        var title = createTitle.val();
        if (title.length > 0) {
          Api.createWorkflow(team.teamid, title).done(function(wf) {
            create.hide();
            nowEditing.text("Editing workflow: " + title);
            workflow.append(viewOfWorkflow(team, wf, preferences, tabContainer));
          });
        }
      });
    });

    return view;
  }

}
