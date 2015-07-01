module WorkflowsTab {

  interface WorkflowView {
    title : JQuery;
    notes : JQuery;
  }

  interface StepView {
    view : JQuery;
    title : JQuery;
    notes : JQuery;
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

  function viewOfCheckItem(ci : ApiT.CheckItem) {
'''
<li #view>
  <input type="checkbox" checked disabled/>
  <input type="text" #text size=60/>
</li>
'''
    text.val(ci.text);
    return view;
  }

  function viewOfStep(s : ApiT.WorkflowStep) : StepView {
'''
<div #view>
  <div>
    <label>Title:</label>
    <input type="text" #title size=40/>
  </div>
  <div>
    <label>Notes:</label>
    <textarea #notes class="workflow-notes" rows=8
                     placeholder="Specific notes for this step"/>
  </div>
  <div>
    <label>Meeting preferences:</label> <i>TODO</i>
  </div>
  <div>
    <label>Checklist:</label>
    <ol #checklist/>
    <button class="button-primary" #newItem>New checklist item</button>
  </div>
'''
    title.val(s.title);
    if (s.notes.length > 0) notes.val(s.notes);
    if (s.checklist.length > 0) {
      List.iter(s.checklist, function(ci) {
        checklist.append(viewOfCheckItem(ci));
      });
    } else {
      checklist.before($("<i class='empty-checklist'>(Empty)</i>"));
    }
    newItem.click(function() {
      var ci : ApiT.CheckItem = {
        text: "",
        checked: false
      };
      view.find(".empty-checklist").remove();
      checklist.append(viewOfCheckItem(ci));
    });

    return <StepView> _view;
  }

  function viewOfWorkflow(team : ApiT.Team,
                          wf : ApiT.Workflow,
                          tabContainer : JQuery) {
'''
<div #view>
  <div>
    <label>Title:</label>
    <input type="text" #title size=40/>
  </div>
  <div>
    <label>Notes:</label>
    <textarea #notes class="workflow-notes" rows=8
                     placeholder="General notes for the workflow"/>
  </div>
  <hr style="clear: left"/>
  <div #chooseStep>
    Choose an existing step to edit:
    <select #steps class="esper-select" style="float: none">
      <option value="header">Select step...</option>
    </select>
  </div>
  <div #create>
    <i>Or</i> enter the title of a new step:
    <input type="text" #createTitle size=40 placeholder="Step title"/>
    <button class="button-primary" #createButton>Create Step</button>
  </div>
  <div #edit>
    <big #nowEditing/>
  </div>
  <hr/>
  <button class="button-primary" #save>Save Workflow</button>
  <button class="button-secondary" #cancel>Cancel</button>
<div>
'''
    var stepById : { [id:string] : ApiT.WorkflowStep } = {};
    var currentStep : ApiT.WorkflowStep;
    var currentStepView : StepView;

    title.val(wf.title);
    if (wf.notes.length > 0) notes.val(wf.notes);

    if (wf.steps.length > 0) {
      List.iter(wf.steps, function(s) {
        var opt = ("<option value='" + s.id + "'>" + s.title + "</option>");
        stepById[s.id] = s;
        steps.append(opt);
      });
    } else {
      steps.replaceWith($("<i>(No current steps)</i>"));
    }

    steps.change(function() {
      var chosen = $(this).val();
      if (chosen !== "header") {
        chooseStep.hide();
        create.hide();
        currentStep = stepById[chosen];
        currentStepView = viewOfStep(currentStep);
        nowEditing.text("Editing step: " + currentStep.title);
        edit.append(currentStepView.view);
      }
    });

    createButton.click(function() {
      var title = createTitle.val();
      if (title.length > 0) {
        chooseStep.hide();
        create.hide();
        currentStep = {
          id: Util.randomString(),
          title: title,
          notes: "",
          checklist: []
        };
        nowEditing.text("Editing step: " + title);
        wf.steps.push(currentStep);
        currentStepView = viewOfStep(currentStep);
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
    Choose an existing workflow to edit:
    <select class="esper-select" style="float: none" #editDropdown>
      <option value="header">Select workflow...</option>
    </select>
  </div>
  <div #create>
    <i>Or</i> enter the title of a new workflow:
    <input #createTitle type="text" size=40 placeholder="Workflow title"/>
    <button class="button-primary" #createButton>Create Workflow</button>
  </div>
  <div #workflow>
    <big #nowEditing/>
  </div>
</div>
'''
    Api.listWorkflows(team.teamid).done(function(response) {
      if (response.workflows.length > 0) {
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
      } else {
        editDropdown.replaceWith($("<i>(No current workflows)</i>"));
      }
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
