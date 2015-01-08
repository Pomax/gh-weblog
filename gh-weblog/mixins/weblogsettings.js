module.exports = {
  settingsName: (function() {
    var loc = window.location.host;
    var path = window.location.pathname;
    loc += (path.lastIndexOf('/') === path.length-1 ? path : '/');
    return "gh-weblog-settings-" + loc;
  }()),

  getSettings: function() {
    var settings = window.localStorage[this.settingsName];
    if(!settings) return false;
    return JSON.parse(settings);
  },

  saveSettings: function(settings) {
    window.localStorage[this.settingsName] = JSON.stringify(settings);
  },

  clearSettings: function() {
    window.localStorage.removeItem(this.settingsName);
  }
}