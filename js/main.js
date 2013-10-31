(function(){
  var weblogContent = false;

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
    weblogContent = window["gh-weblog"];
    weblogContent.entries = {};
    weblogContent.content.forEach(function(resource) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "content/"+resource+".json", false);
        xhr.send(null);
        var data = xhr.responseText;
        try {
          data = JSON.parse(data);
          weblogContent.entries[""+data.published] = data;
          cue(function() { window["gh-weblog"].addEntry(data.published, data); });
        }
        catch (e) { console.error("JSON parse error", e); }
      } catch (e) { console.error("XHR error for "+resource+".json", e); }
    });
    weblogContent.setCredentials(true);
  }

  /**
   * Let's do this thing.
   */
  function setup() {
    window.nunjucksEnv = new nunjucks.Environment(new nunjucks.WebLoader('views'));
    nunjucksEnv.addFilter("readableDate", function(data) {
      return (new Date(data)).toLocaleString();
    });
    nunjucksEnv.addFilter("shortDate", function(data) {
      return (new Date(data)).toLocaleDateString();
    });
    cue(buildPage);
  }

  /**
   * Resource loading
   */
  var done = 0;
  function load(libraries) {
    done = libraries.length;
    libraries.forEach(function(lib) {
      var s = document.createElement("script");
      s.onload = function() {
      	done--;
      	if(done === 0) {
          cue(setup);
        }
      };
      s.src = "js/" + lib;
      document.head.appendChild(s);
    });
  }

  load(["markdown.min.js", "github.js", "nunjucks.js", "administration.js", "content.js"]);

}());
