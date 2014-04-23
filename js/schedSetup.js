/*
  Scheduling Setup
*/

var schedSetup = (function() {
  var mod = {};

  var doneButton = $("<button class='btn btn-primary done-setup'/>")
    .text("Done");

  function editGuest(updateAddButton) {
    var edit = {};

    function updateUI() {
      updateAddButton(edit);
    }

    edit.emailInput = $("<input type='email'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "Email address");
    edit.firstNameInput = $("<input type='text'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "First name")
      .attr("disabled", true);
    edit.lastNameInput = $("<input type='text'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "Last name")
      .attr("disabled", true);
    edit.phoneInput = $("<input type='tel'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "Phone number")
      .attr("disabled", true);

    edit.firstLast = function() {
      return {
        first: edit.firstNameInput.val(),
        last: edit.lastNameInput.val()
      };
    }

    edit.optUid = null;

    edit.isValid = function() {
      return isValidName(edit.firstNameInput.val())
          && isValidName(edit.lastNameInput.val())
          && util.isString(edit.optUid);
    }

    function updateNameEditability(editable) {
      if (util.isString(edit.optUid) && editable) {
        edit.firstNameInput.removeAttr("disabled");
        edit.lastNameInput.removeAttr("disabled");
        edit.phoneInput.removeAttr("disabled");
      } else {
        edit.firstNameInput.attr("disabled", true);
        edit.lastNameInput.attr("disabled", true);
        edit.phoneInput.attr("disabled", true);
      }
    }

    edit.clearUid = function() {
      edit.optUid = null;
      updateNameEditability(false);
    }

    edit.setProfile = function(prof) {
      edit.optUid = prof.profile_uid;
      // TODO Allow pseudonyms for guests?
      if (util.isNotNull(prof.first_last_name)) {
        edit.firstNameInput.val(prof.first_last_name.first);
        edit. lastNameInput.val(prof.first_last_name.last);
      }
      if (util.isNotNull(prof.phones) && prof.phones.length > 0) {
        // TODO Support more than one phone number on frontend?
        edit.phoneInput.val(prof.phones[0].number);
      }
      updateNameEditability(prof.editable);
      updateUI();
    };

    edit.willFetchProfile = false;

    function fetchProfile() {
      if (edit.willFetchProfile) {
        var emailAddr = edit.emailInput.val();
        if (email.validate(emailAddr)) {
          api.getProfileByEmail(emailAddr)
            .then(edit.setProfile);
        } else {
          edit.clearUid();
          updateUI();
        }
      } else {
        updateUI();
      }
    }

    util.afterTyping(edit.emailInput, 250, fetchProfile);
    util.afterTyping(edit.firstNameInput, 250, updateUI);
    util.afterTyping(edit.lastNameInput, 250, updateUI);

    return edit;
  }

  function viewOfEAEditor(x, profs, task, guestUid, eaCheck, hosts, guestTbl,
                          guestOptions, removeEA, makeViewOfEA) {
'''
<div #view
     class="sched-step1-ea-row">
  <div class="relationship-branch"/>
  <div #removeCirc
       class="add-guest-circ cancel">
    <div class="plus-guest cancel">
      <img #removeIcon/>
    </div>
  </div>
  <div class="ea-input-div clearfix">
    <div #title
         class="edit-guest-title"/>
    <div #inputs/>
    <button #addButton
            class="btn btn-primary disabled"
            style="float: right"/>
    <span #cancel
        class="cancel-edit-mode link"
        style="float: right">Cancel</span>
  </div>
</div>
'''

    var ea = sched.assistedBy(guestUid, guestOptions);
    function updateAddButton(edit) {
      if (edit.isValid() && edit.optUid !== guestUid)
        addButton.removeClass("disabled");
      else
        addButton.addClass("disabled");
    }
    var edit = editGuest(updateAddButton);
    if (util.isNotNull(ea)) {
      var prof = profs[ea].prof;
      edit.setProfile(prof);
      if (util.isNotNull(prof.emails) && prof.emails.length > 0) {
        edit.emailInput.val(prof.emails[0].email);
      }
    } else {
      edit.willFetchProfile = true;
    }
    edit.emailInput.focus();

    svg.loadImg(removeIcon, "/assets/img/plus.svg");

    title.text(util.isNotNull(ea) ? "EDIT ASSISTANT" : "NEW ASSISTANT");
    inputs
      .append(edit.emailInput)
      .append(edit.firstNameInput)
      .append(edit.lastNameInput)
      .append(edit.phoneInput);

    var updating = util.isNotNull(ea);

    addButton
      .text(updating ? "Update" : "Add assistant")
      .click(function() {
        var firstLast = edit.firstLast();
        var email = edit.emailInput.val();
        var phone = edit.phoneInput.val();
        var uid = edit.optUid;
        api.getTaskProfile(uid, task.tid).then(function(prof) {
          // TODO Allow pseudonym for guests?
          prof.first_last_name = firstLast;
          // TODO Support more than one email address for guests?
          prof.emails = [{email: email}];
          if (phone.length > 0) {
            // TODO Support more than one phone number on frontend?
            prof.phones = [{number: phone}];
          }
          if (prof.editable) {
            api.postTaskProfile(prof, task.tid);
          }
          profile.setWithTask(prof, task.tid); /* update cache */

          sched.optionsForGuest(guestOptions, guestUid).assisted_by = uid;
          saveGuests(task, hosts, guestTbl, guestOptions);

          mp.track(updating ? "Update assistant" : "Add assistant");

          profile.profilesOfTaskParticipants(task).then(function(profs) {
            view.replaceWith(makeViewOfEA(profs, uid));
          });
        });
      });

    removeCirc.click(function() {
      if (util.isNotNull(ea)) {
        removeEA();
      } else {
        view.remove();
        x.removeClass("has-ea");
        eaCheck.removeClass("checkbox-selected");
      }
    });

    cancel.click(function() {
      if (util.isNotNull(ea)) {
        view.replaceWith(makeViewOfEA(profs, ea));
      } else {
        view.remove();
        x.removeClass("has-ea");
        eaCheck.removeClass("checkbox-selected");
      }
    });

    return _view;
  }

  function viewOfEAProfile(profs, task, uid, editEA, removeEA) {
'''
<div #view
     class="sched-step1-ea-row">
  <div class="relationship-branch"/>
  <div #readOnly>
    <div #editButton
          class="btn-group edit-guest">
        <button #edit
                type="button"
                class="btn btn-default edit-guest-btn">
          Edit
        </button>
        <button type="button"
                class="btn btn-default dropdown-toggle"
                data-toggle="dropdown">
          <span class="caret"/>
          <span class="sr-only">Toggle Dropdown</span>
        </button>
        <ul class="dropdown-menu pull-right edit-option-dropdown"
            role="menu">
          <li #editProfile>
            <a class="edit-profile">Edit profile</a>
          </li>
          <li #remove>
            <a class="remove-guest">Remove assistant</a>
          </li>
        </ul>
    </div>
    <div #assistantDetails/>
  </div>
</div>
'''
    var prof = profs[uid].prof;
    var chatHead = profile.viewMediumCirc(prof).addClass("list-prof-circ");
    var nameView = profile.viewMediumFullName(prof).addClass("ea-name");
    var bridgeLink = $("<a class='bridge-link'>View Bridge</a>").click(function() {
      api.getGuestAppURL(task.tid, uid).done(function (url) {
        window.open(url.url);
      });
    });
    var email = $("<div class='ea-email'>")
      .append(profile.email(prof));

    assistantDetails
      .append(chatHead)
      .append((nameView)
        .append(bridgeLink))
      .append(email);

    edit.click(editEA);
    editProfile.click(editEA);
    remove.click(removeEA);

    return _view;
  }

  function viewOfGuestEditor(profs, task, guestTbl, guestOptions, uid,
                             updateGuestDetails, cancelEditGuest) {
'''
<div #view
     class="guest-input-div clearfix">
  <div #title
       class="edit-guest-title"/>
  <div #inputs/>
  <button #addButton
          class="btn btn-primary disabled"
            style="float: right"/>
  <span #cancel
      class="cancel-edit-mode link"
      style="float: right">Cancel</span>
</div>
'''
    function updateAddButton(edit) {
      if (edit.isValid())
        addButton.removeClass("disabled");
      else
        addButton.addClass("disabled");
    }

    title.text(util.isNotNull(uid) ? "EDIT GUEST" : "NEW GUEST");

    var edit = editGuest(updateAddButton);
    if (util.isNotNull(uid)) {
      var prof = profs[uid].prof;
      edit.setProfile(prof);
      if (util.isNotNull(prof.emails) && prof.emails.length > 0) {
        edit.emailInput.val(prof.emails[0].email);
      }
    } else {
      edit.willFetchProfile = true;
    }

    edit.emailInput.focus();

    inputs
      .append(edit.emailInput)
      .append(edit.firstNameInput)
      .append(edit.lastNameInput)
      .append(edit.phoneInput);

    var updating = util.isNotNull(uid);

    addButton
      .text(updating ? "Update" : "Add guest")
      .click(function() {
        var firstLast = edit.firstLast();
        var email = edit.emailInput.val();
        var phone = edit.phoneInput.val();
        var uid = edit.optUid;
        api.getTaskProfile(uid, task.tid).then(function(prof) {
          // TODO Allow pseudonym for guests?
          prof.first_last_name = firstLast;
          // TODO Support more than one email address for guests?
          prof.emails = [{email: email}];
          if (phone.length > 0) {
            // TODO Support more than one phone number on frontend?
            prof.phones = [{number: phone}];
          }
          if (prof.editable) {
            api.postTaskProfile(prof, task.tid);
          }
          profile.setWithTask(prof, task.tid); /* update cache */

          guestTbl[uid] = uid;
          delete sched.optionsForGuest(guestOptions, uid).assisted_by;
          saveGuests(task, sched.getHosts(task), guestTbl, guestOptions);

          mp.track(updating ? "Update guest" : "Add guest");

          profile.profilesOfTaskParticipants(task).then(function(profs) {
            updateGuestDetails(profs, uid);
          });
        });
      });

    return _view;
  }

  function viewOfGuestProfile(profs, task, hosts, guestTbl, guestOptions, uid) {
'''
<div #view
     class="sched-step1-guest-row">
  <div #readOnly>
    <div #editButton
          class="btn-group edit-guest">
        <button #edit
                type="button"
                class="btn btn-default edit-guest-btn">
          Edit
        </button>
        <button type="button"
                class="btn btn-default dropdown-toggle"
                data-toggle="dropdown">
          <span class="caret"/>
          <span class="sr-only">Toggle Dropdown</span>
        </button>
        <ul class="dropdown-menu pull-right edit-option-dropdown"
            role="menu">
          <li #editProfile>
            <a class="edit-profile">Edit profile</a>
          </li>
          <li #remove>
            <a class="remove-guest">Remove guest</a>
          </li>
        </ul>
    </div>
    <div #guestDetails/>
  </div>
  <div #editable
       class="hide">
    <div #removeCirc
         class="add-guest-circ cancel">
      <div class="plus-guest cancel">
        <img #removeIcon/>
      </div>
    </div>
    <div #inputs/>
  </div>
</div>
'''
    function updateGuestDetails(profs, uid) {
      guestDetails.children().remove();
      viewOfGuestDetails(profs, uid);
      cancelEdit();
    }

    function viewOfGuestDetails(profs, uid) {
      var prof = profs[uid].prof;
      var chatHead = profile.viewMediumCirc(prof).addClass("list-prof-circ");
      var nameView = profile.viewMediumFullName(prof).addClass("guest-name");
      var bridgeLink = $("<a class='bridge-link'>View Bridge</a>").click(function() {
        api.getGuestAppURL(task.tid, uid).done(function (url) {
          window.open(url.url);
        });
      });
      var email = $("<div class='guest-email'>")
        .append(profile.email(prof));
      var phone = $("<div class='guest-phone'>")
        .append(profile.phone(prof));

      guestDetails
        .append(chatHead)
        .append((nameView)
        .append(bridgeLink))
        .append(email);

      if (util.isNotNull(prof.phones) && prof.phones.length > 0)
        guestDetails.append(phone)
    }

    function cancelEdit() {
      inputs.children().remove();

      readOnly.removeClass("hide");
      editable.addClass("hide");
    }

    function startEdit() {
      var guestEditor = viewOfGuestEditor(profs, task, guestTbl, guestOptions, uid,
                                            updateGuestDetails, cancelEdit);
      inputs.append(guestEditor.view);
      guestEditor.cancel.click(cancelEdit);

      readOnly.addClass("hide");
      editable.removeClass("hide");
    }

    svg.loadImg(removeIcon, "/assets/img/plus.svg");

    viewOfGuestDetails(profs, uid);

    edit.click(startEdit);
    editProfile.click(startEdit);

    return _view;
  }

  /* Read-only view of a participant */
  function rowViewOfParticipant(profs, task, hosts, guestTbl, guestOptions,
                                uid) {
    var ea = sched.assistedBy(uid, guestOptions);
    var hasEA = util.isNotNull(ea);
    var view = $("<div class='sched-step1-row'>");

    var guestView = viewOfGuestProfile(profs, task, hosts, guestTbl,
                                       guestOptions, uid);
    view.append(guestView.view);
    guestView.remove.click(function() {
      view.remove();
      removeGuest(task, guestTbl, uid, guestOptions);
    });
    guestView.removeCirc.click(function() {
      view.remove();
      removeGuest(task, guestTbl, uid, guestOptions);
    });

    var eaCheck = $("<div class='communicate-ea'/>");
    var checkbox = $("<img class='ea-checkbox'/>").appendTo(eaCheck);
    svg.loadImg(checkbox, "/assets/img/checkbox-sm.svg");
    eaCheck.append($("<div class='communicate-ea-text'/>")
      .text("Communicate with this guest's assistant"));

    var eaView = $("<div/>");
    view.append(eaCheck)
        .append(eaView);

    function removeEA() {
      delete sched.optionsForGuest(guestOptions, uid).assisted_by;
      saveGuests(task, hosts, guestTbl, guestOptions);

      eaView.children().remove();
      eaCheck.removeClass("checkbox-selected");
      guestView.view.removeClass("has-ea");
    }
    var editViewOfEA;
    function viewOfEA(profs, ea) {
      function editEA() {
        eaView.children().remove();
        eaView.append(editViewOfEA(profs));
      }
      return viewOfEAProfile(profs, task, ea, editEA, removeEA).view;
    }
    editViewOfEA = function(profs) {
      return viewOfEAEditor(guestView.view, profs, task, uid, eaCheck, hosts,
                            guestTbl, guestOptions, removeEA, viewOfEA).view;
    };

    eaCheck.click(function() {
      if (eaCheck.hasClass("checkbox-selected")) {
        removeEA();
      } else {
        eaCheck.addClass("checkbox-selected");
        guestView.view.addClass("has-ea");
        eaView.append(editViewOfEA(profs));
      }
    });

    if (hasEA) {
      eaCheck.addClass("checkbox-selected");
      guestView.view.addClass("has-ea");
      eaView.append(viewOfEA(profs, ea));
    }

    return view;
  }

  /* Form allowing the user to enter a new participant
     at the bottom of the list */
  function rowViewOfNewParticipant(profs, task, guestTbl, guestOptions,
                                   guestList) {
'''
<div #view
     class="add-guest-row click-mode">
  <div #adder
       class="add-guest-circ">
    <div #plus
         class="plus-guest"/>
  </div>
  <div #addClick
       class="add-guest-click clearfix">
    <div #addGuest
         class="add-guest-text unselectable">
      Add guest
    </div>
  </div>
  <div #inputs/>
</div>
'''
    var hosts = sched.getHosts(task);
    var plusIcon = $("<img/>")
      .appendTo(plus);
    svg.loadImg(plusIcon, "/assets/img/plus.svg");

    function addNewGuest(profs, uid) {
      guestList.append(rowViewOfParticipant(profs, task, hosts, guestTbl,
                       guestOptions, uid));
      clearAddGuest();
    }

    function clearAddGuest() {
      inputs.children().remove();

      view.addClass("click-mode");
      addClick.removeClass("hide");
      adder
        .removeClass("cancel")
        .addClass("return-to-add");
      plus
        .removeClass("cancel")
        .addClass("return-to-add");
    }

    function showAddGuest() {
      var newInput = viewOfGuestEditor(profs, task, guestTbl, guestOptions, null,
                                       addNewGuest, clearAddGuest);
      inputs.append(newInput.view);
      newInput.cancel.click(clearAddGuest);

      view.removeClass("click-mode");
      addClick.addClass("hide");
      adder
        .removeClass("return-to-add")
        .addClass("cancel");
      plus
        .removeClass("return-to-add")
        .addClass("cancel");
    }

    addClick.click(showAddGuest);

    adder.click(function() {
      if (view.hasClass("click-mode")) {
        showAddGuest();
      } else {
        clearAddGuest();
      }
    });

    return {
      view: view
    };
  }

  function collectGuests(hosts, guestTbl, guestOptions) {
    var result = {};
    function addResult(uid, mayAttend) {
      result[uid] = uid;
      sched.optionsForGuest(guestOptions, uid).may_attend = mayAttend;
    }

    for (var uid in guestOptions) {
      var options = guestOptions[uid];
      if (util.isNotNull(options.assisted_by)
       && util.isNotNull(guestTbl[uid])) {
        addResult(options.assisted_by, false);
      }
    }
    for (var uid in guestTbl) {
      addResult(uid, true);
    }
    list.iter(hosts, function(uid) {
      delete result[uid];
    });

    return list.ofTable(result);
  }

  function isValidName(s) {
    return profile.shortenName(s).length > 0;
  }

  function updateStage(ta) {
    if (sched.getAttendingGuests(ta).length === 0) {
      sched.getState(ta).scheduling_stage = "Guest_list";
    } else if (ta.task_status.task_progress !== "Confirmed") {
      ta.task_status.task_progress = "Coordinating";
      sched.getState(ta).scheduling_stage = "Coordinate";
    }
  }

  function updateButtons(ta) {
    if (sched.getAttendingGuests(ta).length === 0) {
      $(".show-coordination-tab").addClass("disabled");
      doneButton.addClass("disabled");
    } else {
      $(".show-coordination-tab").removeClass("disabled");
      doneButton.removeClass("disabled");
    }
  }

  function disableButtons() {
    $(".show-coordination-tab").addClass("disabled");
    doneButton.addClass("disabled");
  }

  /* remove guest */
  function removeGuest(ta, guestTbl, uid, guestOptions) {
    var hosts = sched.getHosts(ta);
    disableButtons();
    delete guestTbl[uid];
    saveGuests(ta, hosts, guestTbl, guestOptions);
  }

  function updateGuests(ta, hosts, guestTbl, guestOptions) {
    var guests = collectGuests(hosts, guestTbl, guestOptions);
    ta.task_participants.organized_for = list.union(hosts, guests);
    sched.getState(ta).participant_options = list.ofTable(guestOptions);
  }

  function saveGuests(ta, hosts, guestTbl, guestOptions) {
    updateGuests(ta, hosts, guestTbl, guestOptions);
    updateStage(ta);
    return api.postTask(ta).done(function(ta) {
      updateButtons(ta);
      observable.onTaskParticipantsChanged.notify(ta);
    });
  }

  function viewOfGuests(profs, ta, hosts) {
'''
<div #view
     class="setup-section">
  <div #iconContainer
       class="setup-section-icon"/>
  <div class="setup-section-content">
    <h4 class="bold">Guests</h4>
    <div #help
         class="help-text"/>
    <div #content
         class="setup-guests">
      <div #guestList/>
    </div>
  </div>
</div>
'''
    var icon = $("<img class='svg-block guests-icon'/>")
      .appendTo(iconContainer);
    svg.loadImg(icon, "/assets/img/guests.svg");

    var guests = sched.getAttendingGuests(ta);
    var guestTbl = list.toTable(guests);
    var guestOptions = sched.getGuestOptions(ta);
    var addResult =
      rowViewOfNewParticipant(profs, ta, guestTbl, guestOptions, guestList);

    list.iter(guests, function(uid) {
      rowViewOfParticipant(profs, ta, hosts, guestTbl, guestOptions, uid)
        .appendTo(guestList);
    });

    updateButtons(ta);
    content.append(addResult.view);

    return _view;
  }

  function viewOfLiveMeetingPage(profs, ta, host) {
'''
<div #view
     class="setup-section live-meeting-page-section col-sm-6">
  <div #iconContainer
       class="setup-section-icon"/>
  <div class="setup-section-content">
    <h4 class="bold">Live meeting page</h4>
    <div #help
         class="help-text"/>
    <input #link
           class="form-control setup-input"/>
    <button #copy
            class="btn btn-primary copy-link disabled">
      Copy link
    </button>
  </div>
</div>
'''
    var icon = $("<img class='svg-block live-icon'/>")
      .appendTo(iconContainer);
    svg.loadImg(icon, "/assets/img/link.svg");

    var hostName = profile.firstName(profs[host].prof);

    if (hostName.slice(-1) === "s") {
      hostName += "'";
    } else {
      hostName += "'s";
    }

    help.text("This link appears in the event description on " + hostName
              + " calendar. A separate link will be created for each guest.");

    api.getGuestAppURL(ta.tid, host).done(function (url) {
      link.val(url.url);
    });

    link.click(function() {
      this.select();
    });

    return _view;
  }

  function viewOfEmailSubject(ta) {
'''
<div #view
     class="setup-section email-subject-section col-sm-6">
  <div #iconContainer
       class="setup-section-icon"/>
  <div class="setup-section-content">
    <h4 class="bold">Email subject</h4>
    <div #help
         class="help-text">
      This subject is used for every email sent to a guest regarding
      the meeting.
      We do not recommend editing the subject after exchanging messages
      with the guests because it may break the conversation
      into multiple threads.
    </div>
    <input #subject
           class="form-control setup-input"/>
    <button #update
            class="btn btn-primary update-subject disabled">
      Update
    </button>
  </div>
</div>
'''
    var icon = $("<img class='svg-block subject-icon'/>")
      .appendTo(iconContainer);
    svg.loadImg(icon, "/assets/img/email.svg");

    var origSubject = ta.task_status.task_title;
    subject.val(origSubject);

    util.afterTyping(subject, 100, function() {
      var s = subject.val();
      if (s !== origSubject) {
        update.removeClass("disabled");
      }
      else {
        update.addClass("disabled");
      }
    });

    update.one("click", function() {
      update.addClass("disabled");
      ta.task_status.task_title = subject.val();
      var async = api.postTask(ta);
      spinner.spin("Updating...", async);
      async.then(function(ta) {
        task.loadTask(ta);
      });
    });

    return _view;
  }

  mod.load = function(profs, ta, view) {
    var hosts = sched.getHosts(ta);
    var host;
    list.iter(hosts, function(uid) {
      host = uid;
    });

    doneButton
      .off("click")
      .click(function() {
        mp.track("Done with setup");
        updateStage(ta);
        sched.loadTask(ta);
      });

    view
      .append(doneButton)
      .append($("<h3>Manage settings for this meeting.</h3>"))
      .append($("<hr/>"))
      .append($("<div class='clearfix'/>")
        .append(viewOfEmailSubject(ta).view)
        .append(viewOfLiveMeetingPage(profs, ta, host).view))
      .append($("<hr/>"))
      .append(viewOfGuests(profs, ta, hosts).view);
  };

  return mod;
}());
