(function loadBlog() {

  var settings = window.WebLogSettings;
  var id = settings.target || 'gh-weblog';
  var target = document.getElementById(id);

  if (!target) {
    var msg = "no target element with id '"+id+"' found to inject gh-weblog into.";
    return console.error(msg);
  }

  var React = require("react");

  if(!React) { return setTimeout(loadBlog, 200); }

  var WebLog = require("./WebLog.jsx");

  React.render(React.createElement(WebLog, settings), target);

}());
