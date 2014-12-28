var Connector = function(api_key) {
  this.github = new Octokit({
    token: api_key
  });
};

Connector.prototype = {

  loadIndex: function(process) {
    setTimeout( function() { process([ 1, 2, 3]); }, 100);
  },

  loadEntry: function(item, process) {
    setTimeout( function() {
      process({
        meta: {
          created: Date.now(),
          lastedit: Date.now(),
          draft: false,
          deleted: false,
          title: "entry "+item,
          tags: ['test','item'],
          published: item
        },
        text: "This is test data for entry "+item
      });
    }, 100);
  },


  saveEntry: function(entry) {
    // ... code goes here...
  }

};

var connector = new Connector(localStorage["gh-weblog-api-key"]);
