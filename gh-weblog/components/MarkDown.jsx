var React = require("react");

module.exports = React.createClass({

  mixins: [
    require("../mixins/markdown")
  ],

  render: function() {
    this.html = this.markdown(this.props.text)
    return <div className="post" hidden={this.props.hidden} onClick={this.props.onClick} {...this.html}/>
  },

  getHTML: function() {
    return this.html.dangerouslySetInnerHTML.__html;
  }

});
