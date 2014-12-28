var Entry = React.createClass({

  getInitialState: function() {
    return {
      meta: {
        title: "",
        created: Date.now(),
        lastedit: Date.now(),
        published: -1,
        tags: [],
        draft: false,
        deleted: false
      },
      text: "",
      editing: false
    };
  },

  componentDidMount: function() {
    this.setState({
      meta: this.props.meta,
      text: this.props.text
    });
  },

  render: function() {
    var text = this.state.text;
    var id = "entry-" + this.state.meta.created;
    return (
      <div className="entry" id={id}>
        <MarkDown ref="markdown" hidden={this.state.editing}  text={text} onClick={this.edit} />
        <Editor ref="editor" hidden={!this.state.editing} onChange={this.update} onDone={this.view} onDelete={this.delete}/>
      </div>
    );
  },

  edit: function() {
    this.refs.editor.setText(this.state.text);
    this.setState({ editing: true });
  },

  update: function(evt) {
    this.setState({ text: evt.target.value, lastedit: Date.now() });
  },

  view: function(evt) {
    this.setState({ editing: false });
  },

  delete: function(evt) {
    this.props.onDelete(this);
  },

  // serialise this entry to RSS xml
  toRSS: function() {
    // ... code goes here ...
  }

});
