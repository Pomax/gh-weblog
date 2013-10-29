window. cue = function(fn) {
//  console.error("cueing function " + fn.name);
  requestAnimationFrame(fn);
};

(function(){

  var nunjucksEnv = false,
      weblogContent = false,
      entries = false;

  /**
   * process a blog post
   */
  function processPost(data) {
    try {
      nunjucksEnv.render("entry.html", data, function(err, result) {
        if(err) { return console.error("Nunjucks render error", err); }
        var _ = document.createElement("div");
        _.innerHTML = result;
        var element = _.children[0];
        entries.appendChild(element);
        window['gh-weblog'].parseEntry(element);
      });
    } catch (e) { return console.error("Nunjucks error", e); }
  }

  /**
   * Content building
   */
  function buildPage() {
    weblogContent = window["gh-weblog"];
    weblogContent.entries = {};
    weblogContent.content.forEach(function(resource) {
      if(resource.trim() === "") return;
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "content/"+resource+".json", false);
        xhr.send(null);
        var data = xhr.responseText;
        try {
          data = JSON.parse(data);
          weblogContent.entries[""+data.published] = data;
          cue(function processPostFromData() { processPost(data); });
        }
        catch (e) { console.error("JSON parse error", e); }
      } catch (e) { console.error("XHR error for "+resource+".json", e); }
    });
  }

  /**
   * Let's do this thing.
   */
  function setup() {
    entries = document.getElementById("entries");
    nunjucksEnv = new nunjucks.Environment(new nunjucks.WebLoader('views'));
    nunjucksEnv.addFilter("markdownToHTML", function(data) {
      return markdown.toHTML(data);
    });
    cue(buildPage);
  }

  /**
   * Resource loading
   */
  var done = 0;
  function load(libraries) {
    libraries.forEach(function(lib) {
      done++;
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
