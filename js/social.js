function Facebook() {
  this.loggedIn = false;
}

Facebook.prototype.share = function(message) {
  log('sharing on facebook',message);
  if(!this.loggedIn) {
    log('not logged in yet.');
    return false;
  }
  FB.ui({
      method: 'feed',
      name: 'I\'m using GBAPP!',
      caption: 'This is the caption.',
      description: message,
      link: 'http://darkmatter.ps.uci.edu/gbtest/',
      picture: 'http://darkmatter.ps.uci.edu/gbtest/img/apple-touch-icon-72x72-precomposed.png'
    }, 
    function(response) {
      log('shareOnFacebook', response);
  });
  return false;  
}

Facebook.prototype.handleStatusChange = function(response) {
  if (response.authResponse) {
    log('facebookStatusChange',response);
    this.loggedIn = true;
  }
}

facebook = new Facebook();

function share(activeModule) {
  var message = 'GBAPP is amazing.';
  if(activeModule) {
    message = 'I like the "' + activeModule.label + '" module.';
  }
  facebook.share(message);
}
