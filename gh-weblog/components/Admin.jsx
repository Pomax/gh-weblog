var Admin = React.createClass({

  getInitialState: function() {
    return {
      hidden: true,
      user: '',
      repo: '',
      branch: '',
      path: 'gh-weblog',
      token: ''
    };
  },

  componentDidMount: function() {
    var obj = localStorage["gh-weblog-settings"];
    if(obj) {
      try {
        obj = JSON.parse(obj);
        obj.hidden = this.props.hidden;
        this.setState(obj);
      } catch(e) {}
    }
  },

  render: function() {
    return (
      <div className="underlay" hidden={this.state.hidden} onClick={this.close}>
        <div className="overlay" onClick={this.stopPropagation}>
          <button className="logout" onClick={this.reset}>Log out</button>
          <h1>Weblog administration settings</h1>
          <table>
            <tr>
              <td>Your github username:</td>
              <td><input type="text" placeholder="yourname" value={this.state.user} onChange={this.changeUser} /></td>
            </tr>
            <tr>
              <td>github repository:</td>
              <td><input type="text" placeholder="yourname.github.io" value={this.state.repo} onChange={this.changeRepo} /></td>
            </tr>
            <tr>
              <td>repository branch:</td>
              <td><input type="text" placeholder="master" value={this.state.branch} onChange={this.changeBranch} /></td>
            </tr>
            <tr>
              <td>path to weblog:</td>
              <td><input type="text" value={this.state.path} onChange={this.changePath} /></td>
            </tr>
          </table>
          <h1>Github <a href="https://github.com/settings/applications">Personal Access Token</a></h1>
          <input type="text" className="token" value={this.state.token} onChange={this.changeToken} />
          <p>Don&#39;t give this token more permissions than necessary! gh-weblog only needs repo access!</p>
        </div>
      </div>
    );
  },

  reset: function() {
    localStorage.removeItem("gh-weblog-settings");
    this.setState({
      user: '',
      repo: '',
      branch: '',
      path: 'gh-weblog',
      token: '',
      hidden: true
    });
    this.props.onLogout();
  },

  show: function() {
    this.setState({ hidden: false });
  },

  close: function() {
    this.setState({ hidden: true });
    this.props.onClose({
      user: this.state.user,
      repo: this.state.repo,
      branch: this.state.branch,
      path: this.state.path,
      token: this.state.token
    });
  },

  stopPropagation: function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
  },

  changeUser: function(evt) {
    this.setState({ user: evt.target.value }, this.update);
  },

  changeRepo: function(evt) {
    this.setState({ repo: evt.target.value }, this.update);
  },

  changeBranch: function(evt) {
    this.setState({ branch: evt.target.value }, this.update);
  },

  changePath: function(evt) {
    this.setState({ path: evt.target.value }, this.update);
  },

  changeToken: function(evt) {
    this.setState({ token: evt.target.value }, this.update);
  },

  update: function() {
    localStorage["gh-weblog-settings"] = JSON.stringify(this.state);
  }

});
