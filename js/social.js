function handleFacebookStatusChange(response) {
  if (response.authResponse) {
    log('facebookStatusChange',response);
    updateUserInfo(response);
  }
}
