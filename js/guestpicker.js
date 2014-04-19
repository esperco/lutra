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
           placeholder="Search by first name, last name or email address"/>
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
        <input #FirstName
               type="text"
               class="form-control guest-input"
               placeholder="First Name" disabled/>
        <input #LastName
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

    return form;
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

    form.email = guest.email;
    form.firstname = guest.firstname;
    form.lastname = guest.lastname;

    if (util.isNotNull(uid)) {
      form.uid = uid.uid;
    }
  }

  function setGuest(form, guest, uid) {
    setLocationNoCallback(form, guest, uid);
    form.onLocationSet(guest);
  }

  function clearGuest(form) {
    setGuest(form, {});
    form.searchBox.val("")
                  .focus();
  }

  function addSuggestedSavedPlacesToMenu(form, predictions, showDetails) {
    var menu = form.dropdownMenu;
    if (predictions.from_saved_places.length === 0) return;

    $('<li role="presentation" class="dropdown-header"/>')
      .text("Saved Places")
      .appendTo(menu);

    list.iter(predictions.from_saved_places, function(item) {
      var bolded;
      var title = item.loc.title;
      var coord = item.loc.coord;
      var address = item.loc.address;
      var instructions = item.loc.instructions;
      var esc = util.htmlEscape;
      if (item.matched_field === "Address") {
        bolded = geo.highlight(address, [item.matched_substring]);
        if (title && title != address) {
          bolded = esc(title) + ", " + bolded;
        }
      } else if (item.matched_field === "Title") {
        bolded = geo.highlight(title, [item.matched_substring])
          + ", " + esc(address);
      } else {
        // TODO Error, bad API response, should never happen
      }
      var li = $('<li role="presentation"/>')
        .appendTo(menu);
      $('<a role="menuitem" tabindex="-1" href="#"/>')
        .html(bolded)
        .appendTo(li)
        .click(function() {
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
    });
    $('<li role="presentation" class="divider"/>')
      .appendTo(menu);
  }

  /*
    Display addresses as autocompleted by Google or by Esper using
    the user's saved places.
  */
  function displayPredictionsDropdown(form, predictions, showDetails) {
    if (predictions.from_saved_places.length === 0) return;
    var menu = form.dropdownMenu;
    menu.children().remove();

    /* Fill the menu with suggested addresses from user's saved places */
    addSuggestedSavedPlacesToMenu(form, predictions, showDetails);

    util.showDropdown(form.dropdownToggle);
  }

  function predictGuest(form, showDetails) {

    var textInput = form.searchBox.val();
    log(textInput);
    /*api.getProfileSearch(teamid,textInput)
      .done(function(predictions) {
        displayPredictionsDropdown(form, predictions, showDetails);
      });*/
  }

  function setup(form, showDetails) {
    form.guestSearch.removeClass("hide");
    form.guestForm.addClass("hide");
    util.afterTyping(form.searchBox, 250, function() {
      predictGuest(form, showDetails);
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
    - onLocationSet(loc):
        called when the location is set
    - onTimezoneChange(oldTz, newTz):
        called when the timezone is set or changes
   */
  mod.create = function(param) {
    var form = createGuestForm(param);
    var showDetails = param.showDetails;
    log(showDetails);
    setup(form, showDetails);

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

      getSavedPlaceID: (function () { return form.savedPlaceID; })
    };
  }

  return mod;
})();
