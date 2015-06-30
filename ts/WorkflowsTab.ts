module WorkflowsTab {

  interface WorkflowView {
    title : JQuery;
    notes : JQuery;
  }

  interface StepView {
    view : JQuery;
    title : JQuery;
    notes : JQuery;
    prefs : JQuery;
    checklist : JQuery;
  }

  function saveChanges(team : ApiT.Team,
                       wf : ApiT.Workflow,
                       wfv : WorkflowView,
                       s : ApiT.WorkflowStep,
                       sv : StepView) : JQueryPromise<void> {
    var newTitle = wfv.title.val();
    if (newTitle.length > 0) wf.title = newTitle;
    wf.notes = wfv.notes.val();

    if (s) {
      var step = List.find(wf.steps, function(x) {
        return x.title === s.title;
      });
      var newStepTitle = sv.title.val();
      if (newStepTitle.length > 0) step.title = newStepTitle;
      step.notes = sv.notes.val();
    }

    return Api.updateWorkflow(team.teamid, wf.id, wf);
  }

  function viewOfStep(s : ApiT.WorkflowStep) : StepView {
'''
<div #view>
  <div>
    Title:
    <input #title/>
  </div>
  <div>
    Notes:
    <textarea #notes placeholder="Specific notes for this step"/>
  </div>
  <div>
    Meeting preferences:
    <div #prefs/>
  </div>
  <div>
    Checklist:
    <ul #checklist/>
  </div>
'''
    title.val(s.title);
    if (s.notes.length > 0) notes.val(s.notes);
    return <StepView> _view;
  }

  function viewOfWorkflow(team : ApiT.Team,
                          wf : ApiT.Workflow,
                          tabContainer : JQuery) {
'''
<div #view>
  <div>
    Title:
    <input #title/>
  </div>
  <div>
    Notes:
    <textarea #notes placeholder="General notes for the whole workflow"/>
  </div>
  <div>
    Choose an existing step to edit:
    <select multiple #steps/>
  </div>
  <div #create>
    Or enter the title of a new step:
    <input #createTitle placeholder="Step title"/>
    <button #createButton>Create Step</button>
  </div>
  <div #edit>
    <b #nowEditing/>
  </div>
  <button #save>Save Workflow</button>
  <button #cancel>Cancel</button>
<div>
'''
    title.val(wf.title);
    if (wf.notes.length > 0) notes.val(wf.notes);

    var stepByTitle : { [title:string] : ApiT.WorkflowStep } = {};
    if (wf.steps.length > 0) {
      List.iter(wf.steps, function(s) {
        var opt = ("<option>" + s.title + "</option>");
        stepByTitle[s.title] = s;
        steps.append(opt);
      });
    } else {
      steps.replaceWith($("<i>(No current steps)</i>"));
    }

    var currentStep : ApiT.WorkflowStep;
    var currentStepView : StepView;
    steps.change(function() {
      var chosen = steps.find($(":selected"));
      if (chosen.length === 1) {
        currentStep = stepByTitle[chosen.text()];
        currentStepView = viewOfStep(currentStep);
        nowEditing.text("Editing step " + currentStep.title);
        edit.append(currentStepView.view);
      }
    });

    createButton.click(function() {
      var title = createTitle.val();
      if (title.length > 0) {
        currentStep = {
          title: title,
          notes: "",
          checklist: []
        };
        create.after($("<hr/>"));
        nowEditing.text("Editing step: " + title);
        wf.steps.push(currentStep);
        currentStepView = viewOfStep(newStep);
        edit.append(currentStepView.view);
      }
    });

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

  export function load(team, tabContainer) {
'''
<div #view>
  <div #edit>
    <b>Choose an existing workflow to edit: </b>
    <select #editDropdown>
      <option value="header">Select workflow...</option>
    </select>
  </div>
  <div #create>
    <b>Or enter the title of a new workflow: </b>
    <input #createTitle placeholder="Workflow title"/>
    <button #createButton>Create Workflow</button>
  </div>
  <div #workflow>
    <b #nowEditing/>
  </div>
</div>
'''
    Api.listWorkflows(team.teamid).done(function(response) {
      var wfById : { [wfid:string] : ApiT.Workflow } = {};
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
          workflow.append(viewOfWorkflow(team, wf, tabContainer));
        }
      });
    });

    createButton.click(function() {
      var title = createTitle.val();
      if (title.length > 0) {
        Api.createWorkflow(team.teamid, title).done(function(wf) {
          edit.hide();
          create.hide();
          nowEditing.text("Editing workflow: " + title);
          workflow.append(viewOfWorkflow(team, wf, tabContainer));
        });
      }
    });

    return view;
  }

}
