module Esper.ExecutivePreferences {

  $(function () {
    $("#categories ul").append(phoneForm());
  });
  
  /** The basic form widget which has a prominent on/off toggle and a
   *  link for customizing availability. The actual forms like meal
   *  times or calls are extensions of this.
   *
   *  The custom parts of the form should go in the div called "rest",
   *  below everything else.
   *
   *  The given title will be used for the form's header. The icon,
   *  if passed in, will go at the top.
   */
  export function form(title) {
'''
<li #container>
  <div #iconDiv></div>
  <h1 #header>  </h1>
    <form #form class="toggle">
    <label>  <input type="radio" name="toggle" /> <span>No</span> </label>
    <label>  <input type="radio" name="toggle" checked /> <span>Yes</span> </label>
  </form>

  <div class="customize-availability">
    <a href="#">Customize availability</a>
  </div>

  <hr />

  <div #rest>
  </div>
</li>
'''    

    // if (icon) container.prepend(icon);

    header.text(title);
    form.append(durations().label);

    var possibleDurations = durations();
    form.after(possibleDurations.container);

    return _view;
  }

  /** Returns a drop-down menu for possible meeting durations. */
  export function durations() {
'''
<label class="durations" #container>
  Preferred duration
  <select #select>
    <option value="any" selected>any</option>
    <option value="0:10">0:10</option>
    <option value="0:20">0:20</option>
    <option value="0:30">0:30</option>
    <option value="0:40">0:40</option>
    <option value="1:00">1:00</option>
    <option value="1:30">1:30</option>
    <option value="2:00">2:00</option>
    <option value="2:30">2:30</option>
  </select>
</label>
'''    

    return _view;
  }

  /** Returns the element containing the whole phone form. */
  export function phoneForm() {
    var phone = form("Phone");
    phone.rest.append(phoneWidget().container);
    phone.iconDiv.append($("<img src='/home/tikhon/Documents/work/esper/otter/pub/img/phone-placeholder.png' alt='' />"));

    return phone.container;
  }

  /** A widget for entering any number of phone numbers.
   */
  export function phoneWidget() {
'''
<div class="phone-widget" #container>
  <div #phoneNumbers>
  </div>
  <br />
  <a href="#" #anotherNumber>Add another phone number</a>
</div>
'''
    phoneNumbers.append(phoneNumber().container);

    anotherNumber.click(function () {
      phoneNumbers.append(phoneNumber().container);
    });

    return _view;
  }

  export function phoneNumber() {
'''
<div class="phone-number" #container>
  <select class="phone-type" #select>
    <option value="mobile" selected>mobile</option>
    <option value="work">work</option>
    <option value="home">home</option>
    <option value="other">other</option>
  </select>
  <input type="text" class="phone-number" />
</div>
'''

    return _view;
  }
}

