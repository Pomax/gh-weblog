function setupWebLog(options) {
  var context = window["gh-weblog"] = {};
  if(options.path.lastIndexOf("/") !== options.path.length - 1) {
    options.path += "/";
  }
  context.path = options.path;
  context.newestFirst = options.order ? options.order=="newest" : false;

  /**
   * Goddamnit, IE
   */
  if(!window.console) {
    window.console = {
      error: function() {},
      log: function() {}
    };
  }

  /**
   * Calling requestAnimationFrame, even though it does
   * exactly what we want, is weird. So we alias it to "cue".
   */
  window.cue = (window.requestAnimationFrame ?
    function(fn) { requestAnimationFrame(fn); }
    :
    function(fn) { setTimeout(fn, 0); }
  );

  /**
   * Content building
   */
  function buildPage() {
    setupPostHandling();
    context.entries = {};
    var list = context.content.slice();
    if(!context.newestFirst) {
      list = list.reverse();
    }
    (function loadEntry() {
      if(list.length === 0) return;
      resource = list.splice(0,1)[0];
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", context.path + "content/"+resource+".json", true);
        xhr.onreadystatechange  = function() {
          if (xhr.readyState === 4) {
            if (xhr.status === 0 || xhr.status === 200) {
              var data = xhr.responseText;
              try {
                data = JSON.parse(data);
                context.entries[""+data.published] = data;
                cue(function() {
                  context.addEntry(data.published, data);
                  loadEntry();
                });
              }
              catch (e) { console.error("JSON parse error", e); }
            }
          }
        };
        xhr.send(null);
      } catch (e) { console.error("XHR error for "+resource+".json", e); }
    }());
    context.setCredentials(true);
  }

  /**
   * Let's do this thing.
   */
  function setup() {
    Object.keys(options).forEach(function(key) {
      context[key] = options[key];
    });
    if(!context.username || !context.repo) {
      return console.error("No username/repo provided for gh-weblog.");
    }
    window.nunjucksEnv = new nunjucks.Environment(new nunjucks.WebLoader(context.path + 'views'));
    nunjucksEnv.addFilter("readableDate", function(data) {
      return (new Date(data)).toLocaleString();
    });
    nunjucksEnv.addFilter("shortDate", function(data) {
      return (new Date(data)).toLocaleDateString();
    });
    nunjucksEnv.render("container.html", {}, function(err, result) {
      if(err) { return console.error("Nunjucks render error", err); }
      var container = document.querySelector("#gh-weblog-container");
      container.innerHTML = result;
      cue(buildPage);
    });
  }

  /**
   * Resource loading
   */
  var done = 0;
  function load(libraries) {
    done = libraries.length;
    libraries.forEach(function(src) {
      var s = document.createElement("script");
      s.onload = function() {
        done--;
        if(done === 0) {
          cue(setup);
        }
      };
      s.src = context.path + "js/" + src;
      document.head.appendChild(s);
    });
  }

  load(["jquery.2", "underscore.js", "octokit.js", "nunjucks.js", "administration.js", "content.js", "marked.js"]);
}
