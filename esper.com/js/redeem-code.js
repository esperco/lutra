function validateCode(s) {
  var re = /[a-zA-Z0-9]{5,15}/;
  return re.test(s);
}

function redeemCode() {
  reset();

  var input = $('#redeem-code');
  var btn = $('#redeem-code-btn');
  var code = input.val();
  var termsCheck = $('#terms-check');

  if (validateCode(code) && !termsCheck.prop('checked')) {
    var stored = JSON.stringify({ code: code });
    var secure = location.protocol === "http:" ? "" : "; secure";
    try {
      localStorage.setItem("one-month-code", stored);
    } catch (err) {}
    document.cookie = "one-month-code=" + stored + "; path=/" + secure;
    location.href = "/time#!/payment-info";
  }

  else {
    input.parents('.form-group').addClass('has-error');
  }
}

function reset() {
  $('.form-group').removeClass('has-error');
  $('#redeem-code-btn').prop("disabled", false);
}

function main() {
  reset();
  $('#redeem-code-btn').click(function(e) {
    e.preventDefault();
    redeemCode();
    return false;
  });
}

$(document).ready(main);
