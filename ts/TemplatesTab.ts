/*
  Team Settings - Templates Tab
*/

module TemplatesTab {

  interface TemplateView {
    title: JQuery;
    notes: JQuery;
  }

  function saveChanges(team: ApiT.Team,
                       tmp: ApiT.Template,
                       tmpv: TemplateView): JQueryPromise<void> {
    var newTitle = tmpv.title.val();
    if (newTitle.length > 0) tmp.title = newTitle;
    tmp.notes = tmpv.notes.val();

    return Api.updateTemplate(team.teamid, tmp.id, tmp);
  }

  function viewOfTemplate(team: ApiT.Team,
                          tmp: ApiT.Template,
                          prefs: ApiT.Preferences,
                          tabContainer: JQuery) {
'''
<div #view>
  <div class="bottom-gap top-gap">
    <label>Title:</label>
    <input type="text" #title size=40/>
  </div>
  <div>
    <div #help class="bottom-gap top-gap">
      Use these tags to construct a template:
      <button #exec class="button-primary">{EXEC}</button>
      <button #event class="button-primary">{EVENT}</button>
    </div>
    <label>Text:</label>
    <div #editor class="workflow-notes"/>
    <textarea #notes class="workflow-notes" rows=8
                     placeholder="General notes for the workflow"/>
  </div>
  <hr style="clear: left"/>
  <button class="button-primary" #save>Save Template</button>
  <button class="button-secondary" #cancel>Cancel</button>
  <button class="button-danger" #deleteTemplate style="float: right">
  Delete Template
  </button>
</div>
'''

    title.val(tmp.title);
    if (tmp.notes.length > 0) notes.val(tmp.notes);

    function reload() {
      tabContainer.children().remove();
      tabContainer.append(load(team, tabContainer));
    }

    exec.click(function() {

    });

    save.click(function() {
      var tmpv = <TemplateView> _view;
      saveChanges(team, tmp, tmpv).done(reload);
    });

    cancel.click(reload);

    deleteTemplate.click(function() {
      var ok =
        confirm("Are you sure you want to delete template " + tmp.title + "?");
      if (ok) Api.deleteTemplate(team.teamid, tmp.id).done(reload);
    });

    return view;
  }

  export function load(team : ApiT.Team, tabContainer) {
'''
<div #view>
  <div #edit class="bottom-gap top-gap" >
    Choose an existing template to edit:
    <select class="esper-select" style= "float: none" #editDropdown>
      <option value="header">Select template...</option>
    </select>
  </div>
  <div #create>
    <input #createTitle type="text" size=40 placeholder="Template title" />
    <button class="button-primary" #createButton> Create Template</button>
  </div>
  <div #template>
    <big #nowEditing/>
  </div>
</div>
'''
    Api.getPreferences(team.teamid).done(function(prefs) {
      var preferences = $.extend(true, Preferences.defaultPreferences(), prefs);

      Api.listTemplates(team.teamid).done(function(response) {
        if (response.templates.length > 0) {
          var tmpById: { [tmpid: string]: ApiT.Template } = {};
          List.iter(response.templates, function(tmp) {
            var opt = ("<option value='" + tmp.id + "'>" + tmp.title + "</option>");
            tmpById[tmp.id] = tmp;
            editDropdown.append(opt);
          });
          editDropdown.change(function() {
            var chosen = $(this).val();
            if (chosen !== "header") {
              var tmp = tmpById[chosen];
              edit.hide();
              create.hide();
              nowEditing.text("Editing template: " + tmp.title);
              template.append(viewOfTemplate(team, tmp, preferences, tabContainer));
            }
          });
        } else {
          editDropdown.replaceWith($("<i>(No current templates)</i>"));
        }
      });

      createButton.click(function() {
        var title = createTitle.val();
        if (title.length > 0) {
          Api.createTemplate(team.teamid, title).done(function(tmp) {
            create.hide();
            nowEditing.text("Editing template: " + title);
            template.append(viewOfTemplate(team, tmp, preferences, tabContainer));
          });
        }
      });
    });

    return view;
  }

}
