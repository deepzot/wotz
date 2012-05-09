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

function share(activeModule) {
  var message = 'GBAPP is amazing.';
  if(activeModule) {
    message = 'I like the "' + activeModule.label + '" module.';
  }
  log('sharing',message);
  if(facebookReady) shareOnFacebook(message);
}
