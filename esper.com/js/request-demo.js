function validateEmailAddress(s) {
  var re = /\S+@\S+\.\S+/;
  return re.test(s);
}

function requestDemo() {
  reset();

  var input = $('#signup-email');
  var btn = $('#signup-email-btn');
  var email = input.val();
  var termsCheck = $('#terms-check');

  if (validateEmailAddress(email) && !termsCheck.prop('checked')) {
    var prefix = (Esper && Esper.PRODUCTION) ?
      "https://app.esper.com/" :
       location.protocol + "//" + location.hostname + "/";
    input.prop("disabled", true);
    btn.prop("disabled", true);
    $.ajax({
      url: prefix + "api/support/email",
      method: "POST",
      data: JSON.stringify({
        body: email + " requested demo"
      })
    }).then(function() {
      input.val("");
      $('#signup-success').removeClass('hidden');
    }, function() {
      $('#signup-fail').removeClass('hidden');
    }).always(function() {
      input.prop("disabled", false);
      btn.prop("disabled", false);
    });
  }

  else {
    input.parents('.form-group').addClass('has-error');
  }
}

function reset() {
  $('#signup-success').addClass('hidden');
  $('#signup-fail').addClass('hidden');
  $('.form-group').removeClass('has-error');
  $('#signup-email-btn').prop("disabled", false);
}

function main() {
  reset();
  $('#signup-email-btn').click(function(e) {
    e.preventDefault();
    requestDemo();
    return false;
  });
}

$(document).ready(main);
