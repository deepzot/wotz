var facebookReady = false;

function handleFacebookStatusChange(response) {
  if (response.authResponse) {
    log('facebookStatusChange',response);
    facebookReady = true;
  }
}

function shareOnFacebook(message) {
  log('sharing on facebook');
  FB.ui({
    method: 'feed',
    name: 'I\'m using GBAPP!',
    caption: message,
    description: 'This is the description.',
    link: 'http://darkmatter.ps.uci.edu/gbtest/'
    //picture: 'http://www.facebookmobileweb.com/getting-started/img/facebook_icon_large.png'
  }, 
  function(response) {
    log('shareOnFacebook', response);
  });
  return false;
}

function share(activeModule) {
  var message = 'GBAPP is amazing.';
  if(activeModule) {
    message = 'I like the "' + activeModule.label + '" module.';
  }
  log('sharing',message);
  if(facebookReady) shareOnFacebook(message);
}
