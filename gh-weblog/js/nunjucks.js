/**
 * Tiny nunjucks.js shim
 */
(function() {

  var passthrough = function(v) { return v; };

  var Environment = function(loader) {
    this.filters = {};
    this.loader = loader;
  };

  Environment.prototype = {
    addFilter: function(name, fn) {
      this.filters[name] = fn;
    },
    render: function(template, options, callback) {
      var filters = this.filters;
      var data = this.loader.load(template, function(err, data) {
        if(err) return (callback ? callback(err) : err);
        var match, re;
        // conditional filtering
        match = "({%\\s*if\\s+(\\w+)\\s*%}(.*){%\\s*endif\\s*%})";
        re = new RegExp(match, 'g');
        data = data.replace(re, function() {
          var macro = arguments[2];
          if(!options[macro]) {
            return '';
          }
          return arguments[3];
        });
        // macro replacements
        Object.keys(options).forEach(function(key) {
          match = "{{\\s*("+key+")\\s*(\\|\\s*((\\w+)\\s*)+)?}}";
          re = new RegExp(match,'g');
          data = data.replace(re, function() {
            var fn = arguments[4];
            fn = (fn ? filters[fn] : passthrough);
            return fn(options[key]);
          });
        });
        return (callback ? callback(null, data) : data);
      });
    }
  };

  var WebLoader = function(path) {
    if (path.lastIndexOf("/") !== path.length-1) {
      path += "/";
    }
    this.path = path;
  };

  WebLoader.prototype = {
    load: function(url, onload) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", this.path + url, true);
      xhr.onreadystatechange  = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 0 || xhr.status === 200) {
            var data = xhr.responseText;
            onload(null, data);
          } else { onload(xhr.status); }
        }
      }
      xhr.send(null);
    }
  }

  window.nunjucks = {
    Environment: Environment,
    WebLoader: WebLoader
  }

}());
