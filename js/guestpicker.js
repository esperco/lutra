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
    <div #locationDetails class="clearfix">
      <div class="col-sm-7 address-form">
        <input #email
               type="text"
               class="form-control guest-input"
               placeholder="email"/>
        <input #firstname
               type="text"
               class="form-control guest-input"
               placeholder="First Name"/>
        <input #lastname
               type="text"
               class="form-control guest-input"
               placeholder="Last Name"/>
        <span #resetGuest
              class="reset-guest">
          <img class="reset-guest-icon svg"
               src="/assets/img/reset.svg"/>
          <span class="reset-guest-text danger-link">
            Reset guest
          </span>
        </span>
      </div>
    </div>
</div>
'''
    var form = _view;
    log(param.task);
    log(param.teamid);
    form.task = param.task;
    form.teamid = param.teamid;
    form.onGuestSet = param.onGuestSet;

    form.isValid = function() {
      return isValidName(form.firstname.val())
          && isValidName(form.lastname.val())
          && util.isString(form.uid);
    }

    return form;
  }

  
  function isValidName(s) {
    return profile.shortenName(s).length > 0;
  }

  function getGuest(form) {
    var guest = {
      /* input boxes */
      email: form.email.val(),
      firstname: form.firstname.val(),
      lastname: form.lastname.val(),

      /* copy contents of search box for loceditor */
      search: form.searchBox.val(),
    };
    return guest;
  }

  function getCompleteGuest(form) {
    var loc = getGuest(form);
    if (util.isNonEmptyString(guest.email)
        && util.isString(guest.firstname)
        && util.isString(guest.lastname))
      return guest;
    else
      return null;
  }

  function setGuestNoCallback(form, guest, uid) {
    form.email.val(guest.email);
    form.firstname.val(guest.firstname);
    form.lastname.val(guest.lastname);

    if (util.isNotNull(uid)) {
      form.uid = uid.uid;
    }
  }

  function setGuest(form, guest, uid) {
    setGuestNoCallback(form, guest, uid);
    form.onGuestSet(guest);
  }

  function clearGuest(form) {
    setGuest(form, {});
    form.searchBox.val("")
                  .focus();
  }

  function textToGuest(text) {
    if (email.validate(text)){
      var guest = { email : text,
                    firstname : '',
                    lastname : '' };
      return guest;
    } else {
        var pos = text.search(" ");
        if (pos != -1) {
            var first = text.substring(0,pos);
            var last = text.substring(pos+1,text.length);
            var guest = { email : '',
                          firstname : first,
                          lastname : last };
            return guest;
        } else {
            var guest = { email : '',
                          firstname : text,
                          lastname : '' };
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
      var phone = item.profile.phones[0];
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
        .appendTo(li);

//        .click(function() {
//            api.postTaskProfile(item.profile,task.tid);
//            profile.setWithTask(item.prof, form.task.tid); /* update cache */
//        });

/*        .click(function() {
         api.postSelectPlace(item.google_description)
            .done(function(place) {
              var loc = {
                title: title,
                coord: coord,
                address: address,
                instructions: instructions,
                timezone: place.loc.timezone,
                google_description: item.google_description
              };
              setLocation(form, loc, place);
              util.hideDropdown(form.dropdownToggle);
              if (showDetails) {
                toggleForm(form);
              }
            });
          return false;
        });
*/
    });
    $('<li role="presentation" class="divider"/>')
      .appendTo(menu);
  }

  /*
    Display addresses as autocompleted by Google or by Esper using
    the user's saved places.
  */
  function displayPredictionsDropdown(form, predictions, showDetails) {
    //if (predictions.count === 0) return;
    var menu = form.dropdownMenu;
    menu.children().remove();

    /* Fill the menu with suggested addresses from user's saved places */
    addSuggestedGuestsToMenu(form, predictions, showDetails);

    util.showDropdown(form.dropdownToggle);
  }

  function predictGuest(task,form, showDetails) {
      
    var textInput = form.searchBox.val();
    if(textInput)
      {api.getProfileSearch(form.teamid,textInput)
       .done(function(predictions) {
           log(predictions);
           displayPredictionsDropdown(form, predictions, showDetails);
       });
      }
  }

  function setup(param,form, showDetails) {
    form.guestSearch.removeClass("hide");
    form.guestForm.addClass("hide");
    util.afterTyping(form.searchBox, 250, function() {
      predictGuest(param.task,form, showDetails);
    });
    form.resetGuest
      .click(function() {
        toggleForm(form);
        clearLocation(form);
      });
  }


  /*
    Parameters:
    - teamid
    - showDetails
    - onGuestSet(guest):
        called when the Guest is set
   */
  mod.create = function(param) {
    var form = createGuestForm(param);
    var showDetails = param.showDetails;
    setup(param,form, showDetails);

    return {
      view: form.guest,
      focus: (function() { form.searchBox.focus(); }),

      /* get/set location fields of the form */
      getCompleteGuest: (function () { return getCompleteGuest(form); }),
      setGuest: (function(guest) { return setGuest(form, guest); }),
      toggleForm: (function() { return toggleForm(form); }),

      /* terrible hack to work around circular dependencies */
      setGuestNoCallback:
        (function(guest) { return setGuestNoCallback(form, guest); }),

      getSavedGuestID: (function () { return form.SavedGuestID; })
    };
  }

  return mod;
})();
