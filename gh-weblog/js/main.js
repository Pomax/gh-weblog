(function(){
  var weblogContent = false,
      weblogPath = "gh-weblog/";

  /**
   * Calling requestAnimationFrame, even though it does
   * exactly what we want, is weird. So we alias it to "cue".
   */
  window.cue = function(fn) {
    requestAnimationFrame(fn);
  };


  /**
   * Content building
   */
  function buildPage() {
    context = window["gh-weblog"];
    context.entries = {};
    context.content.forEach(function(resource) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", weblogPath + "content/"+resource+".json", false);
        xhr.send(null);
        var data = xhr.responseText;
        try {
          data = JSON.parse(data);
          context.entries[""+data.published] = data;
          cue(function() { context.addEntry(data.published, data); });
        }
        catch (e) { console.error("JSON parse error", e); }
      } catch (e) { console.error("XHR error for "+resource+".json", e); }
    });
    context.setCredentials(true);
  }

  /**
   * Let's do this thing.
   */
  function setup() {
    window.nunjucksEnv = new nunjucks.Environment(new nunjucks.WebLoader(weblogPath + 'views'));
    nunjucksEnv.addFilter("readableDate", function(data) {
      return (new Date(data)).toLocaleString();
    });
    nunjucksEnv.addFilter("shortDate", function(data) {
      return (new Date(data)).toLocaleDateString();
    });
    window["gh-weblog"].path = weblogPath;
    cue(buildPage);
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
      s.src = src;
      document.head.appendChild(s);
    });
  }

  load(["js/markdown.min.js", "js/github.js", "js/nunjucks.js", weblogPath + "js/administration.js", weblogPath + "js/content.js"]);

}());
