(function() {

  var target = document.getElementById('gh-weblog');

  if(!target) {
    var msg = "no target element with id 'gh-weblog' found to inject gh-weblog into.";
    return console.error(msg);
  }

  var React = require("react");
  var WebLog = require("./WebLog.jsx");

  React.render(React.createElement(WebLog, {
    base: "http://pomax.github.io/gh-blog",
    title: "Github weblogging",
    description: "A free, simple github-based blogging platform"
  }), target);

}());
