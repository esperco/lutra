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
    log("call to toggleForm");
    if (form.guestSearch.hasClass("hide")) {
      form.guestSearch.removeClass("hide");
      form.guestForm.addClass("hide");
    } else {
      form.guestSearch.addClass("hide");
      form.guestForm.removeClass("hide");
    }
  }

  function isValidForm(form) {
      log("call to isValidForm");
      var guest = getGuest(form);
      return (guest != null && email.validate(guest.email)
              &&  util.isString(guest.firstname)
              && util.isString(guest.lastname));
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
            Reset
          </span>
        </span>
      </div>
    </div>
</div>
'''
    var form = _view;
    log(param.teamid);
    form.task = param.task;
    form.optuid = param.uid;
    form.teamid = param.teamid;
    form.onGuestSet = param.onGuestSet;
    

    form.updateUI = function() {
      log("call to updateUI");
      param.updateAddButton(form);
    }
      
    form.isValid = function() {
        log("call to isValid");
        return isValidName(form.firstname.val())
            && isValidName(form.lastname.val())
            && util.isString(form.optuid);
    }
      form.isValidForm = function () { 
          log("call to isValidForm");
          return isValidForm(form); }

    util.afterTyping(form.firstname, 250, form.updateUI);
    util.afterTyping(form.lastname, 250, form.updateUI);
    util.afterTyping(form.email, 250, form.updateUI);

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

      /* copy contents of search box for Guesteditor */
      search: form.searchBox.val(),
    };
    return guest;
  }

  function getCompleteGuest(form) {
    var guest = getGuest(form);
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
    log("call to setGuest");
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
          var guest = {
              email : item.profile.emails[0].email,
              firstname : item.profile.first_last_name.first,
              lastname : item.profile.first_last_name.last
          };
          setGuest(form,guest,item.profile.profile_uid);
          toggleForm(form);
          form.updateUI();
          return false;
        });

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
    log("call to predictGuest");      
    var textInput = form.searchBox.val();
    if(textInput)
      {api.getProfileSearch(form.teamid,textInput)
       .done(function(predictions) {
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
        clearGuest(form);
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
    log("call to guestpicker.create");
    var form = createGuestForm(param);
    var showDetails = param.showDetails;
    setup(param,form, showDetails);

    return {
      view: form.guest,
      focus: (function() { form.searchBox.focus(); }),

      /* get/set location fields of the form */
      getCompleteGuest: (function () { return getCompleteGuest(form); }),
      setGuest: (function(guest,uid) { return setGuest(form, guest,uid); }),
      toggleForm: (function() { return toggleForm(form); }),
      isValidForm: (function() { return isValidForm(form); }),

      /* terrible hack to work around circular dependencies */
      setGuestNoCallback:
        (function(guest) { return setGuestNoCallback(form, guest); }),

      getSavedGuestID: (function () { return form.SavedGuestID; })
    };
  }

  return mod;
})();
