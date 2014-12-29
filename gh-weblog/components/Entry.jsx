var Entry = React.createClass({

  getInitialState: function() {
    return {
      id: -1,
      title: "",
      created: Date.now(),
      published: -1,
      updated: Date.now(),
      tags: [],
      editing: false,
      postdata: ""
    };
  },

  componentDidMount: function() {
    var state = this.props.metadata;
    state.postdata = this.props.postdata;
    this.setState(state);
  },

  render: function() {
    var text = this.getText();
    var id = "entry-" + this.state.created;
    return (
      <div className="entry" id={id}>
        <MarkDown ref="markdown" hidden={this.state.editing}  title={this.state.title} text={text} onClick={this.edit} />
        <Editor ref="editor" hidden={!this.state.editing} text={text} onChange={this.update} onDone={this.view} onDelete={this.delete}/>
      </div>
    );
  },

  getText: function() {
    return '#' + this.state.title + '\n' + this.state.postdata;
  },

  getMetaData: function() {
    var md = JSON.parse(JSON.stringify(this.state));
    delete md.id;
    delete md.editing;
    delete md.postdata;
    return md;
  },

  getPostData: function() {
    return this.state.postdata;
  },

  edit: function() {
    this.refs.editor.setText(this.getText());
    this.setState({ editing: true });
  },

  update: function(evt) {
    // extract title
    var md = evt.target.value;
    var lines = md.split("\n");
    var title = lines.splice(0,1)[0];
    var postdata = lines.join("\n");
    // do something with title and metadata here...
    this.setState({ postdata: postdata });
  },

  view: function(evt) {
    this.setState({ editing: false });
    this.props.onSave(this);
  },

  delete: function(evt) {
    this.props.onDelete(this);
  },

  // serialise this entry to RSS xml
  toRSS: function() {
    // ... code goes here ...
  }

});
