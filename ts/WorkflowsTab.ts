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
<li #view class="bottom-gap">
  <input type="checkbox" checked disabled/>
  <input type="text" #text size=60/>
</li>
'''
    text.val(ci.text);
    return view;
  }

  // Map from constructor tag to other stuff we need for rendering and saving
  interface MeetingTypeData {
    type : string,
    prefs : any, // PhoneInfo or VideoInfo or MealInfo, depending on type
    reader : (li:JQuery) => any // same as above
  }
  type MeetingTypeMap = { [constr:string] : MeetingTypeData }

  function viewOfStep(team : ApiT.Team,
                      s : ApiT.WorkflowStep,
                      prefs : ApiT.Preferences) : StepView {
'''
<div #view>
  <div class="bottom-gap top-gap">
    <label>Title:</label>
    <input type="text" #title size=40/>
  </div>
  <div>
    <label>Notes:</label>
    <textarea #notes class="workflow-notes" rows=8
                     placeholder="Specific notes for this step"/>
  </div>
  <div #meetingPrefs class="top-gap">
    <label>Meeting preferences:</label>
    <select #meetingType class="esper-select" style="float: none">
      <option value="header">Select meeting type...</option>
      <option value="Phone_call">Phone call</option>
      <option value="Video_call">Video call</option>
      <option value="Breakfast">Breakfast</option>
      <option value="Brunch">Brunch</option>
      <option value="Lunch">Lunch</option>
      <option value="Coffee">Coffee</option>
      <option value="Dinner">Dinner</option>
      <option value="Drinks">Drinks</option>
      <option value="Meeting">Meeting</option>
    </select>
  </div>
  <div>
    <label>Checklist:</label>
    <ul #checklist/>
    <button class="button-primary" #newItem>New checklist item</button>
  </div>
'''
    console.log("Step:", s);
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

    var meetingTypes : MeetingTypeMap = {
      "Phone_call": {
        type: "phone",
        prefs: prefs.meeting_types.phone_call,
        reader: PreferencesTab.readPhonePrefs
      },
      "Video_call": {
        type: "video",
        prefs: prefs.meeting_types.video_call,
        reader: PreferencesTab.readVideoPrefs
      },
      "Breakfast": {
        type: "breakfast",
        prefs: prefs.meeting_types.breakfast,
        reader: PreferencesTab.readMealPrefs
      },
      "Brunch": {
        type: "brunch",
        prefs: prefs.meeting_types.brunch,
        reader: PreferencesTab.readMealPrefs
      },
      "Lunch": {
        type: "Lunch",
        prefs: prefs.meeting_types.lunch,
        reader: PreferencesTab.readMealPrefs
      },
      "Coffee": {
        type: "coffee",
        prefs: prefs.meeting_types.coffee,
        reader: PreferencesTab.readMealPrefs
      },
      "Dinner": {
        type: "dinner",
        prefs: prefs.meeting_types.dinner,
        reader: PreferencesTab.readMealPrefs
      },
      "Drinks": {
        type: "drinks",
        prefs: prefs.meeting_types.drinks,
        reader: PreferencesTab.readMealPrefs
      },
      "Meeting": {
        type: "meeting",
        prefs: Preferences.defaultPreferences().meeting_types.coffee,
        reader: PreferencesTab.readMealPrefs
      }
    };

    function save(constr) {
      return function() {
        var mt = meetingTypes[constr];
        var cls = ".esper-prefs-" + mt.type;
        var prefs = mt.reader(meetingPrefs.find(cls).eq(0));
        s.meeting_prefs = [constr, <any> prefs];
      }
    }

    var currentMeetingPrefs = s.meeting_prefs;
    meetingType.change(function() {
      var chosen = $(this).val();
      if (chosen !== "header") {
        meetingPrefs.find(".workflow-meeting-prefs").remove();
        var mt = meetingTypes[chosen];
        var data = currentMeetingPrefs ? currentMeetingPrefs[1] : mt.prefs;
        var meetingView =
          PreferencesTab.viewOfMeetingType(mt.type, data,
                                           team.teamid, save(chosen));
        meetingView.addClass("workflow-meeting-prefs");
        meetingPrefs.append(meetingView);
      }
    });
    if (currentMeetingPrefs) {
      meetingType.val(currentMeetingPrefs[0]);
      meetingType.trigger("change");
    }

    return <StepView> _view;
  }

  function viewOfWorkflow(team : ApiT.Team,
                          wf : ApiT.Workflow,
                          prefs : ApiT.Preferences,
                          tabContainer : JQuery) {
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
  <hr style="clear: left"/>
  <div #chooseStep class="bottom-gap">
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
  <button class="button-danger" #del style="float: right">
    Delete Workflow
  </button>
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
        currentStepView = viewOfStep(team, currentStep, prefs);
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
        currentStepView = viewOfStep(team, currentStep, prefs);
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

    del.click(function () {
      var ok =
        confirm("Are you sure you want to delete workflow " + wf.title + "?");
      if (ok) Api.deleteWorkflow(team.teamid, wf.id).done(reload);
    });

    return view;
  }

  export function load(team, tabContainer) {
'''
<div #view>
  <div #edit class="bottom-gap top-gap">
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
    Api.getPreferences(team.teamid).done(function(prefs) {
      var preferences = $.extend(true, Preferences.defaultPreferences(), prefs);

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
            edit.hide();
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
