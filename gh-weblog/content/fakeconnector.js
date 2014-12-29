var Connector = function(options) {
  this.options = options;
};

Connector.prototype = {

  get: function(url, options, processData) {
    if(options && !processData) {
      processData = options;
      options = {};
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    Object.keys(options).forEach(function(key) { xhr[key] = options[key]; });
    xhr.onload = function(evt) {
      var obj = evt.target.response;
      processData(!obj, obj);
    };
    xhr.send(null);
  },

  json: function(url, processData) {
    this.get(url, { responseType: "json" }, processData);
  },

  loadIndex: function(handleIndex) {
    this.json("content/posts/index.json", function(err, result) {
      handleIndex(err, result ? result.index : false);
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

  saveIndex: function(index) {
    index.sort();
    console.log("saving index");
  },

  saveEntry: function(entry, index) {
    var id = entry.state.id;
    console.log("Saving " + id + " remotely");

    var metadata = JSON.stringify(entry.getMetaData(), false, 2);
    console.log(this.options.path + "/content/posts/metadata/" + id + ".json:", metadata)

    var postdata = entry.getPostData();
    console.log(this.options.path + "/content/posts/markdown/" + id + ".md:", postdata);

    var index = JSON.stringify({index:index},false,2);
    console.log(this.options.path + "/content/index.json", index);
  },

  updateEntry: function(entry) {
    console.log("updating entry "+entry.state.created);
    // ... code goes here ...
  },

  deleteEntry: function(entry, index) {
    var id = entry.state.id;
    console.log("Deleting " + id + " remotely");
    console.log(this.options.path + "/content/posts/metadata/" + id + ".json")
    console.log(this.options.path + "/content/posts/markdown/" + id + ".md");

    var index = JSON.stringify({index:index},false,2);
    console.log(this.options.path + "/content/index.json", index);
  }

};

var connector = new Connector({
  user: "Pomax",
  repo: "gh-blog",
  branch: "react",
  path: "gh-weblog",
  token: "abcdefghijklmnopqrstuvwxyz"
});
