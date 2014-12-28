var MarkDown = React.createClass({

  mixins: [MarkDownMixin],

  render: function() {
    return <div className="post" hidden={this.props.hidden} onClick={this.props.onClick} {...this.markdown(this.props.text)}/>
  }

});
