var WebLog = React.createClass({

  mixins: [
    ConnectorMixin,
    TimeToId,
    RSSGenerator
  ],

  // local cache, because we don't want to load the entire
  // index at once, and we don't want to requery for it.
  index: [],

  // local cache, because we can't be sure state won't
  // be modified multiple times per time slice.
  list: {},

  getInitialState: function() {
    return {
      singleton: false,
      entries: this.list,
      slice: { start: 0, end: 10 },
      authenticated: false
    };
  },

  componentDidMount: function() {
    // are we authenticataed?
    var settings = localStorage["gh-weblog-settings"];
    if(settings) { settings = JSON.parse(settings); }
    this.connector = new this.Connector(settings);
    this.setState({ authenticated: !!settings.token });

    // are we loading one entry, or "all" entries?
    var id = this.timeToId(this.props.entryid);
    if(id) { this.setState({ singleton: true }); }
    this.connector.loadIndex(this.loadIndex, id);
  },

  render: function() {
    var self = this;
    var entries = this.getSlice().map(function(entry) {
      return <Entry key={entry.metadata.created}
                    ref={entry.metadata.id}
                    metadata={entry.metadata}
                    postdata={entry.postdata}
                    editable={!self.state.singleton && self.state.authenticated}
                    onSave={self.save}
                    onDelete={self.delete}/>;
    });
    var postbutton, morebutton, adminbutton;
    if(!this.state.singleton) {
      adminbutton = <button className="authenticate" onClick={this.showSettings} onClose={this.bindSettings}>admin</button>
      if(this.state.authenticated) { postbutton = <button className="admin post button" onClick={this.create}>new entry</button>; }
      morebutton = <button onClick={this.more}>Load more posts</button>;
    }
    return (
      <div ref="weblog" className="gh-weblog">
        <Admin ref="admin" hidden="true" onClose={this.bindSettings}/>
        {adminbutton}
        {postbutton}
        {entries}
        {morebutton}
      </div>
    );
  },

  showSettings: function() {
    this.refs.admin.show();
  },

  bindSettings: function(settings) {
    this.connector.setProperties(settings);
    if(settings.token.trim()) {
      this.setState({ authenticated: true });
    }
  },

  more: function() {
    this.setState({
      slice: {
        start: this.state.slice.start,
        end: this.state.slice.end + 10
      }
    }, this.loadEntries);
  },

  getSlice: function() {
    var list = this.list;
    var start = this.state.slice.start;
    var end = this.state.slice.end;
    var ids = Object.keys(list).sort().reverse().slice(start, end);
    return ids.map(function(id) { return list[id]; });
  },

  loadIndex: function(err, index) {
    // latest entry on top
    this.index = index.reverse();
    this.loadEntries();
  },

  loadEntries: function() {
    var connector = this.connector;
    var setEntry = this.setEntry;
    // find load slice
    var start = this.state.slice.start;
    var end = this.state.slice.end;
    var slice = this.index.slice(start, end);
    var cache = this.list;
    // run through all
    (function next(list) {
      if(list.length===0) return;
      var id = list.splice(0,1)[0];
      if(cache[id]) return next(list);
      connector.loadMetadata(id, function(err, metadata) {
        if(err) {
          console.error("no metadata found for id: "+id+" ("+err+")");
          next(list);
          return;
        }
        connector.loadEntry(id, function(err, postdata) {
          if(err) {
            console.error("no post data found for id: "+id+" ("+err+")");
            next(list);
            return;
          }
          setEntry(id, metadata, postdata);
          next(list);
        });
      });
    }(slice));
  },

  setEntry: function(id, metadata, postdata) {
    metadata.id = id;
    if(this.index.indexOf(id)===-1) {
      this.index.push(id);
    }
    this.list[id] = {
      metadata: metadata,
      postdata: postdata
    };
    this.setState({ entries: this.list });
  },

  create: function() {
    var date = new Date();
    var timestamp = date.getTime();
    var metadata = {
      title: "New Entry",
      created: timestamp,
      published: timestamp, // we can turn this into -1 for drafts
      updated: timestamp,
      tags: []
    };
    var postdata = "...click here to start editing your post...";
    var id = this.timeToId(timestamp);
    this.setEntry(id, metadata, postdata);
  },

  save: function(entry) {
    var self = this;
    var connector = this.connector;
    this.setEntry(entry.state.id, entry.getMetaData(), entry.postdata);
    connector.saveEntry(entry, this.index, function saved() {
      console.log("save handled - updating RSS");
      connector.saveRSS(self.toRSS());
    });
  },

  delete: function(entry) {
    var confirmed = confirm("really delete post?");
    if(confirmed) {
      var self = this;
      var connector = this.connector;
      var id = entry.state.id;
      // remove from index:
      var pos = this.index.indexOf(id);
      this.index.splice(pos,1);
      // remove from list of loaded entries:
      delete this.list[id];
      this.setState({ entries: this.list });
      // delete entry remotely
      connector.deleteEntry(entry, this.index, function deleted() {
        console.log("delete handled - updating RSS");
        connector.saveRSS(self.toRSS());
      });
    }
  }

});

