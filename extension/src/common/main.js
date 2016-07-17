function MyExtension() {
    var self = this;
    kango.ui.browserButton.addEventListener(kango.ui.browserButton.event.COMMAND, function() {
        self._onCommand();
    });
    kango.addMessageListener('AnalyzeC2B', function(evt) {
      if (evt.data.url) {
        var request = kango.xhr.getXMLHttpRequest();
        request.open('GET', 'http://watson-alchemy-demo.mybluemix.net/url?url='+encodeURIComponent(evt.data.url), false);
        request.send(null);
        evt.target.dispatchMessage("AnalyzeRes", request.response);
      } 
      if (evt.data.text) {
        var details = {
          method: 'POST',
          url: 'http://watson-alchemy-demo.mybluemix.net/text',
          params: {"text": evt.data.text},
        };
        kango.xhr.send(details, function(data) {
          evt.target.dispatchMessage("AnalyzeRes", data.response);
        });
      }
    });
}

MyExtension.prototype = {

    _onCommand: function() {
      kango.browser.tabs.getCurrent(function(tab) {
        tab.dispatchMessage('AnalyzeB2C', null);
      });
    }
};

var extension = new MyExtension();
