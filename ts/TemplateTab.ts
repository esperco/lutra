/*
  Team Settings - Templates Tab
*/

module Esper.TemplateTab {

  interface TemplateView {
    title: JQuery;
    content: JQuery;
  }

  function viewOfTemplate(team: ApiT.Team,
                          tmp: ApiT.Template,
                          prefs: ApiT.Preferences,
                          tabContainer: JQuery) {
'''
<div class="esper" #view>
  <div class="bottom-gap top-gap">
    <label>Title:</label>
    <input type="text" #title size=40/>
  </div>
  <div>
    <div #help class="bottom-gap top-gap">
      Use these tags to construct a template:
      <button #exec class="button-primary tag">\{EXEC}</button>
      <button #event class="button-primary tag">\{EVENT}</button>
    </div>
    <label>Text:</label>
    <div #templateText class="workflow-notes"/>
  </div>
  <div #toolbar>
    <span class="ql-format-group">
      <select title="Font" class="ql-font">
        <option value="sans-serif" selected>Sans Serif</option>
        <option value="serif">Serif</option>
        <option value="monospace">Monospace</option>
      </select>
      <select title="Size" class="ql-size">
        <option value="10px">Small</option>
        <option value="13px" selected>Normal</option>
        <option value="18px">Large</option>
        <option value="32px">Huge</option>
      </select>
    </span>
    <span class="ql-format-group">
      <span title="Bold" class="ql-format-button ql-bold"></span>
      <span class="ql-format-separator"></span>
      <span title="Italic" class="ql-format-button ql-italic"></span>
      <span class="ql-format-separator"></span>
      <span title="Underline" class="ql-format-button ql-underline"></span>
    </span>
    <span class="ql-format-group">
      <select title="Text Color" class="ql-color">
        <option value="rgb(0, 0, 0)" selected></option>
        <option value="rgb(230, 0, 0)"></option>
        <option value="rgb(255, 153, 0)"></option>
        <option value="rgb(255, 255, 0)"></option>
        <option value="rgb(0, 138, 0)"></option>
        <option value="rgb(0, 102, 204)"></option>
        <option value="rgb(153, 51, 255)"></option>
        <option value="rgb(255, 255, 255)"></option>
        <option value="rgb(250, 204, 204)"></option>
        <option value="rgb(255, 235, 204)"></option>
        <option value="rgb(255, 255, 204)"></option>
        <option value="rgb(204, 232, 204)"></option>
        <option value="rgb(204, 224, 245)"></option>
        <option value="rgb(235, 214, 255)"></option>
        <option value="rgb(187, 187, 187)"></option>
        <option value="rgb(240, 102, 102)"></option>
        <option value="rgb(255, 194, 102)"></option>
        <option value="rgb(255, 255, 102)"></option>
        <option value="rgb(102, 185, 102)"></option>
        <option value="rgb(102, 163, 224)"></option>
        <option value="rgb(194, 133, 255)"></option>
        <option value="rgb(136, 136, 136)"></option>
        <option value="rgb(161, 0, 0)"></option>
        <option value="rgb(178, 107, 0)"></option>
        <option value="rgb(178, 178, 0)"></option>
        <option value="rgb(0, 97, 0)"></option>
        <option value="rgb(0, 71, 178)"></option>
        <option value="rgb(107, 36, 178)"></option>
        <option value="rgb(68, 68, 68)"></option>
        <option value="rgb(92, 0, 0)"></option>
        <option value="rgb(102, 61, 0)"></option>
        <option value="rgb(102, 102, 0)"></option>
        <option value="rgb(0, 55, 0)"></option>
        <option value="rgb(0, 41, 102)"></option>
        <option value="rgb(61, 20, 102)"></option>
      </select>
      <span class="ql-format-separator"></span>
      <select title="Background Color" class="ql-background">
        <option value="rgb(0, 0, 0)"></option>
        <option value="rgb(230, 0, 0)"></option>
        <option value="rgb(255, 153, 0)"></option>
        <option value="rgb(255, 255, 0)"></option>
        <option value="rgb(0, 138, 0)"></option>
        <option value="rgb(0, 102, 204)"></option>
        <option value="rgb(153, 51, 255)"></option>
        <option value="rgb(255, 255, 255)" selected></option>
        <option value="rgb(250, 204, 204)"></option>
        <option value="rgb(255, 235, 204)"></option>
        <option value="rgb(255, 255, 204)"></option>
        <option value="rgb(204, 232, 204)"></option>
        <option value="rgb(204, 224, 245)"></option>
        <option value="rgb(235, 214, 255)"></option>
        <option value="rgb(187, 187, 187)"></option>
        <option value="rgb(240, 102, 102)"></option>
        <option value="rgb(255, 194, 102)"></option>
        <option value="rgb(255, 255, 102)"></option>
        <option value="rgb(102, 185, 102)"></option>
        <option value="rgb(102, 163, 224)"></option>
        <option value="rgb(194, 133, 255)"></option>
        <option value="rgb(136, 136, 136)"></option>
        <option value="rgb(161, 0, 0)"></option>
        <option value="rgb(178, 107, 0)"></option>
        <option value="rgb(178, 178, 0)"></option>
        <option value="rgb(0, 97, 0)"></option>
        <option value="rgb(0, 71, 178)"></option>
        <option value="rgb(107, 36, 178)"></option>
        <option value="rgb(68, 68, 68)"></option>
        <option value="rgb(92, 0, 0)"></option>
        <option value="rgb(102, 61, 0)"></option>
        <option value="rgb(102, 102, 0)"></option>
        <option value="rgb(0, 55, 0)"></option>
        <option value="rgb(0, 41, 102)"></option>
        <option value="rgb(61, 20, 102)"></option>
      </select>
      <span class="ql-format-separator"></span>
      <select title="Text Alignment" class="ql-align">
        <option value="left" selected></option>
        <option value="center"></option>
        <option value="right"></option>
        <option value="justify"></option>
      </select>
    </span>
    <span class="ql-format-group">
      <span title="Link" class="ql-format-button ql-link"></span>
      <span class="ql-format-separator"></span>
      <span title="List" class="ql-format-button ql-list"></span>
      <span class="ql-format-separator"></span>
    </span>
  </div>
  
  <hr style="clear: left"/>
  <button class="button-primary" #save>Save Template</button>
  <button class="button-secondary" #cancel>Cancel</button>
  <button class="button-danger" #deleteTemplate style="float: right">
  Delete Template
  </button>
</div>
'''

    var editor = new quill(templateText.get(0), {
      modules: {
        'toolbar': {
          container: toolbar.get(0)
        },
        'link-tooltip': true,
        'image-tooltip': true
      },
      styles: false,
      theme: 'snow'
    });

    title.val(tmp.title);
    if (tmp.content.length > 0) editor.setContents(JSON.parse(tmp.content));

    function reload() {
      tabContainer.children().remove();
      tabContainer.append(load(team, tabContainer));
    }

    exec.click(function() {
      editor.focus();
      var range = editor.getSelection();
      editor.insertText(range.start, "{EXEC}");
    });

    event.click(function() {
      editor.focus();
      var range = editor.getSelection();
      editor.insertText(range.start, "{EVENT}");
    });

    save.click(function() {
      var newTitle = title.val();
      if (newTitle.length > 0) tmp.title = newTitle;
      tmp.content = JSON.stringify(editor.getContents());
      return Api.updateTemplate(team.teamid, tmp.id, tmp).done(reload);
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
        if (response.items.length > 0) {
          var tmpById: { [tmpid: string]: ApiT.Template } = {};
          List.iter(response.items, function(tmp) {
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
