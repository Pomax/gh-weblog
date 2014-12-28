var Connector = function() {};

Connector.prototype = {

  get: function(url, options, processData) {
    var xhr = new XMLHTTPRequest();
    xhr.open("GET", url, true);
    Object.keys(options).forEach(function(key) { xhr[key] = options[key]; });
    xhr.onloaded = function(data) {
      try { processData(false, JSON.parse(data)); }
      catch(e) { processData(new Error("couldn't load data from "+url)); }
    };
    xhr.send(null);
  },

  json: function(url, processData) {
    this.get(url, { responseType: "json" }, processData);
  },

  loadIndex: function(handleIndex) {
    this.json("content/posts/index.json", function(err, result) {
      handleIndex(err, result);
    });
  },

  loadMetadata: function(id, handleMetadata) {
    this.json("content/posts/metadata/"+id+".json", function(err, result) {
      handleMetadata(err, result);
    });
  },

  loadEntry: function(id, handleEntry) {
    this.get("content/posts/markdown/"+id+".md", function(err, result) {
      handleEntry(err, result);
    });
  },

  saveEntry: function(entry) {
    // ... code goes here...
  }

};

var connector = new Connector();
