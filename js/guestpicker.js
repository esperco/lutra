/*
  Guest picker

  Input:
  - onSet(profile): fired when the location is set
  - onClear(): fired when the location is cleared

  Output:
  - view: div holding anything needed to prompt the user for a location
*/

var guestpicker = (function() {
  var mod = {};

  // Set by setPositionFromNavigator, stored until refresh
  var position = null;

  function toggleForm(form) {
    if (form.guestSearch.hasClass("hide")) {
      form.guestSearch.removeClass("hide");
      form.guestForm.addClass("hide");
    } else {
      form.guestSearch.addClass("hide");
      form.guestForm.removeClass("hide");
    }
  }


  function setToAltName(form) {
    form.altname.removeClass("hide");
    form.altNameInstruction.text("Use first and last names");
  }

  function setToFullName(form) {
    form.altname.addClass("hide");
    form.pseudonym.val(''); // reinitialises to null
    form.altNameInstruction.text("Use an alternative name");
  }

  function toggleAltName(form) {
    if (form.altname.hasClass("hide")) {
      setToAltName(form);
    } else {
      setToFullName(form);
    }
  }

  function isValidForm(form) {
    var guest = getGuest(form);
    return (isGuestValid(guest));
  }


  function createGuestForm(param) {
'''
<div #guest
     class="clearfix">
  <div #guestSearch class="left-inner-addon">
    <i class="glyphicon glyphicon-search"></i>
    <input #searchBox
           type="search" class="form-control guest-search"
           placeholder="Type first name, last name or email address"/>
    <div class="dropdown">
      <a #dropdownToggle
         data-toggle="dropdown"
         class="hide dropdown-toggle" href="#"></a>
      <ul #dropdownMenu
          class="dropdown-menu"
          role="menu"></ul>
    </div>
  </div>
  <div #guestForm class="hide">
    <div #guestDetails class="clearfix">
      <div class="col-sm-7 address-form">
        <div #fullname>
          <div #prefix />
            <input #firstname
               type="text"
               class="form-control guest-input"
               placeholder="First Name"/>
            <input #lastname
               type="text"
               class="form-control guest-input"
               placeholder="Last Name"/>
        </div>
        <div #altname>
            <input #pseudonym
               type="text"
               class="form-control guest-input"
               placeholder="Alternative Name"/>
        </div>
        <span #altNameLink class="alt-name-link">
            <img class="reset-guest-icon svg"
               src="/assets/img/reset.svg"/>
              <span #altNameInstruction class="use-alternative-name-text danger-link">
                Use an alternative name
              </span>
        </span>
        <input #email
               type="text"
               class="form-control guest-input"
               placeholder="email"/>
        <input #phone
               type="text"
               class="form-control guest-input"
               placeholder="Phone number"/>
        <span #resetGuest
              class="reset-guest">
          <img class="reset-guest-icon svg"
               src="/assets/img/reset.svg"/>
          <span class="reset-guest-text danger-link">
            Reset
          </span>
        </span>
      </div>
    </div>
</div>
'''
    var form = _view;

    form.prefixSel = select.create({
      options: [{label:"No prefix", value:null},
                {label:"Mr.", value:"Mr."},
                {label:"Ms.", value:"Ms."},
                {label:"Mrs.", value:"Mrs."},
                {label:"Miss", value:"Miss"},
                {label:"Dr.", value:"Dr."},
                {label:"Prof.", value:"Prof."}],
      initialKey: "No prefix",
      defaultAction: function () {}
      });
    form.prefix.prepend(form.prefixSel.view);

    form.altname.addClass("hide");

    form.task = param.task;
    form.optuid = param.uid;
    form.teamid = param.teamid;
    form.onGuestSet = param.onGuestSet;


    form.updateUI = function() {
      param.updateAddButton(form);
    }

    form.isValidForm = function () {
      return isValidForm(form);
    }

    util.afterTyping(form.firstname, 250, form.updateUI);
    util.afterTyping(form.lastname, 250, form.updateUI);
    util.afterTyping(form.pseudonym, 250, form.updateUI);
    util.afterTyping(form.email, 250, form.updateUI);
    util.afterTyping(form.phone, 250, form.updateUI);

    return form;
  }

  function isGuestValid(guest) {
    return (
      util.isNotNull(guest)
      && email.validate(guest.email)
      && util.isString(guest.firstname)
      && guest.firstname.length > 0
      && util.isString(guest.lastname)
      && guest.lastname.length > 0
    );
  }


  function getGuest(form) {
    var guest = {
      /* input boxes */
      email: form.email.val(),
      firstname: form.firstname.val(),
      lastname: form.lastname.val(),
      pseudonym: form.pseudonym.val(),
      phone: form.phone.val(),
      prefix: form.prefixSel.get(),

      /* copy contents of search box for Guesteditor */
      search: form.searchBox.val(),
    };
    return guest;
  }

  function getCompleteGuest(form) {
    var guest = getGuest(form);
    if (isGuestValid(guest))
      return guest;
    else
      return null;
  }

  function setGuestNoCallback(form, guest, uid) {
    form.email.val(guest.email);
    form.firstname.val(guest.firstname);
    form.lastname.val(guest.lastname);
    form.phone.val(guest.phone);
    form.prefixSel.set(guest.prefix);
    if (util.isNotNull(guest.pseudonym)) {
      form.pseudonym.val(guest.pseudonym);
      setToAltName(form);
    } else {
      setToFullName(form);
    }
    if (util.isNotNull(uid)) {
      form.uid = uid.uid;
    }
  }

  function setGuestFromProfileNoCallback(form, prof) {
    form.email.val(prof.emails[0].email);
    if (util.isNotNull(prof.first_last_name)) {
      form.firstname.val(prof.first_last_name.first);
      form.lastname.val(prof.first_last_name.last);
    }
    if (util.isNotNull(prof.phones) && prof.phones.length > 0) {
      form.phone.val(prof.phones[0].number);
    }
    form.prefixSel.set(prof.prefix);
    if (util.isNotNull(prof.pseudonym)) {
      form.pseudonym.val(prof.pseudonym);
      setToAltName(form);
    } else {
      setToFullName(form);
    }
    if (util.isNotNull(prof.profile_uid)) {
      form.uid = prof.profile_uid;
    }
  }

  function setGuest(form, guest, uid) {
    setGuestNoCallback(form, guest, uid);
    form.onGuestSet(guest);
  }

  function setGuestFromProfile(form, profile) {
    setGuestFromProfileNoCallback(form, profile);
    form.onGuestSet(getGuest(form));
  }

  function clearGuest(form) {
    setGuest(form, {});
    form.searchBox.val("")
                  .focus();
  }

  function textToGuest(text) {
    if (email.validate(text)) {
      var guest = { email : text,
                    firstname : '',
                    lastname : '' ,
                    pseudonym : null ,
                    phone : '' };
      return guest;
    } else {
      var pos = text.search(" ");
      if (pos != -1) {
        var first = text.substring(0, pos);
        var last = text.substring(pos+1, text.length);
        var guest = { email : '',
                      firstname : first,
                      lastname : last ,
                      pseudonym : null ,
                      phone : '',
                      prefix : null };
        return guest;
      } else {
        var guest = { email : '',
                      firstname : text,
                      lastname : '' ,
                      pseudonym : null ,
                      phone : '',
                      prefix : null };
        return guest;
      }
    }
  }

  function addSuggestedGuestsToMenu(form, predictions, showDetails) {
    var menu = form.dropdownMenu;
    var text = form.searchBox.val();
    $('<li role="presentation" class="dropdown-header"/>')
      .text("Create New Contact")
      .appendTo(menu);
    var liplus = $('<li role="presentation"/>')
      .appendTo(menu);
    $('<a role="menuitem" tabindex="-1" href="#"/>')
      .html(text)
      .appendTo(liplus)
      .click(function() {
          var guest = textToGuest(text);
          setGuest(form, guest, '');
          util.hideDropdown(form.dropdownToggle);
          if (showDetails) {
            toggleForm(form);
          }
          return false;
      });
    $('<li role="presentation" class="divider"/>')
      .appendTo(menu);
    if (predictions.count === 0){
      return;
    }

    $('<li role="presentation" class="dropdown-header"/>')
      .text("Saved Contacts")
      .appendTo(menu);

    list.iter(predictions.results, function(item) {
      var bolded;
      var firstname = item.profile.first_last_name.first;
      var lastname = item.profile.first_last_name.last;
      var name = firstname + ' ' + lastname;
      var email = item.profile.emails[0].email;
      var pseudo = item.profile.pseudonym;
      var prefix = item.profile.prefix;
      var phone = '' ;
      if (item.profile.phones.length > 0){
         phone = item.profile.phones[0].number;
      }
      var uid = item.profile.profile_uid;
      var esc = util.htmlEscape;
      if (item.matched_field === "Name") {
        bolded = geo.highlight(name, [item.matched_substring]);
        bolded = bolded + ', ' + email;
      } else if (item.matched_field === "Email") {
        bolded = geo.highlight(email, [item.matched_substring]);
        bolded = firstname + ' ' + lastname + ', ' + bolded;
      } else {
        // TODO Error, bad API response, should never happen
      }

      var li = $('<li role="presentation"/>')
        .appendTo(menu);
      $('<a role="menuitem" tabindex="-1" href="#"/>')
        .html(bolded)
        .appendTo(li)
        .click(function() {
          setGuestFromProfile(form, item.profile);
          toggleForm(form);
          if (util.isNotNull(item.profile.pseudonym)) {
            setToAltName(form);
          } else {
            setToFullName(form);
          }
          form.updateUI();
          return false;
        });

    });
    $('<li role="presentation" class="divider"/>')
      .appendTo(menu);
  }

  /*
    Display contacts as autocompleted by Esper using the team's saved contacts.
  */
  function displayPredictionsDropdown(form, predictions, showDetails) {
    var menu = form.dropdownMenu;
    menu.children().remove();

    /* Fill the menu with suggested addresses from user's saved places */
    addSuggestedGuestsToMenu(form, predictions, showDetails);

    util.showDropdown(form.dropdownToggle);
  }

  function predictGuest(task, form, showDetails) {
    var textInput = form.searchBox.val();
    if (textInput) {
      api.getProfileSearch(form.teamid, textInput)
       .done(function(predictions) {
         displayPredictionsDropdown(form, predictions, showDetails);
       });
    }
  }

  function setup(param, form, showDetails) {
    form.guestSearch.removeClass("hide");
    form.guestForm.addClass("hide");
    util.afterTyping(form.searchBox, 250, function() {
      predictGuest(param.task, form, showDetails);
    });
    form.resetGuest
      .click(function() {
        toggleForm(form);
        clearGuest(form);
      });
    form.altNameLink
      .click(function() {
        toggleAltName(form);
      });
  }


  /*
    Parameters:
    - task
    - uid
    - teamid
    - showDetails
    - onGuestSet(guest):
        called when the Guest is set
    - updateAddButton(form):
        called when the input is valid
   */
  mod.create = function(param) {
    var form = createGuestForm(param);
    var showDetails = param.showDetails;
    setup(param, form, showDetails);

    return {
      view: form.guest,
      focus: (function() { form.searchBox.focus(); }),

      /* get/set location fields of the form */
      getCompleteGuest: (function () { return getCompleteGuest(form); }),
      setGuest: (function(guest, uid) { return setGuest(form, guest, uid); }),
      setGuestFromProfile: (function(prof) {
          return setGuestFromProfile(form, prof); }),
      toggleForm: (function() { return toggleForm(form); }),
      isValidForm: (function() { return isValidForm(form); }),

      /* terrible hack to work around circular dependencies */
      setGuestNoCallback:
        (function(guest) { return setGuestNoCallback(form, guest); })
    };
  }

  return mod;
})();
