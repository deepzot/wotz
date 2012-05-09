function Facebook() {
  self = this;
  
  this.loggedIn = false;
  
  <!-- Load the facebook SDK (http://developers.facebook.com/docs/guides/mobile/web/#sdk) -->
  window.fbAsyncInit = function() {
    FB.init({
      appId      : '420170771335687', // App ID
      channelUrl : '//darkmatter.ps.uci.edu/gbtest/channel.html', // Channel File
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });
    FB.Event.subscribe('auth.statusChange', function(response) {
      if (response.authResponse) {
        log('facebookStatusChange',response);
        self.login();
      }
    });
  };
  // Load the SDK Asynchronously
  (function(d){
     var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement('script'); js.id = id; js.async = true;
     js.src = "//connect.facebook.net/en_US/all.js";
     ref.parentNode.insertBefore(js, ref);
   }(document));

}

Facebook.prototype.doLoginLogout = function() {
  if(this.loggedIn) {
    log('logging out');
    FB.logout();
    this.loggedIn = false;
    this.updateButtons();
  }
  else {
    log('logging in');
    FB.login(function(response) {
       if (response.authResponse) {
         self.login();
       }
    });
  }
}

Facebook.prototype.updateButtons = function() {
  log('facebook.updateButtons',this.loggedIn);
  if(this.loggedIn) {
    $('#loginButton .ui-btn-text').text('logout');
    $('#shareButton').removeClass('ui-disabled');
  }
  else {
    $('#loginButton .ui-btn-text').text('login');
    $('#shareButton').addClass('ui-disabled');
  }
}

Facebook.prototype.login = function() {
  this.loggedIn = true;
  this.updateButtons();
}

Facebook.prototype.share = function(message) {
  log('sharing on facebook',message);
  self = this;
  if(!this.loggedIn) {
    log('not logged in yet.');
  }
  else {
    // Already logged in...
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
  }
  return false;  
}

function share(activeModule) {
  var message = 'GBAPP is amazing.';
  if(activeModule) {
    message = 'I like the "' + activeModule.label + '" module.';
  }
  facebook.share(message);
}
