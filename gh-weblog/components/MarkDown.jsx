var MarkDown = React.createClass({

  mixins: [MarkDownMixin],

  render: function() {
    this.html = this.markdown(this.props.text)
    return <div className="post" hidden={this.props.hidden} onClick={this.props.onClick} {...this.html}/>
  },

  getHTML: function() {
    return this.html.dangerouslySetInnerHTML.__html;
  }

});
