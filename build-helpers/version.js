var exec = require('sync-exec');

/*
  Returns git hash as version
*/
module.exports = function() {
  return exec("git log --pretty=format:'%H' -n 1");
}
