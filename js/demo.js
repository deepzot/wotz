function DemoApp() {
  this.data = null;
  this.modules = [ ];
  this.module = null;
  this.container = $('#moduleContent');
}

DemoApp.prototype.start = function() {

  // Use 'self' as an alias for 'this' when we are in a context that hides 'this'
  var self = this;
  
  // Show the disclaimer dialog.
  $('#showDisclaimerDialog').click();
  
  // Attach toolbar selection handlers for each of our modules.
  for(var index = 0; index < this.modules.length; index++) {
    var module = this.modules[index];
    log('installing module',module.id);
    // This double-function syntax is required to get the correct closures.
    // See http://www.mennovanslooten.nl/blog/post/62
    $('#'+module.id+'Select').click((function(m) {
      return function() {
        if(self.module) {
          log('ending',self.module.id);
          self.module.end();
        }
        log('starting',m.id);
        self.module = m;
        m.start(self.data);
        m.update(self.container);
      }
    })(module));
  }

  // Enable drag-and-drop, if possible.
  if(window.File && window.FileList && window.FileReader) {
    var xhr = new XMLHttpRequest();
    if(xhr.upload) {
      var dropBusy = false;
      $('#gbIcon').css({ 'opacity' : 0.4 });
      $('#dropMessage p').text('...or drop your data here.');
      $('#dropData')
        .on('dragover', function(event) {
          if(!dropBusy) {
            $('#dropMessage p').text('Drop Here!');
            $('#gbIcon').css({ 'opacity' : 1.0 });
            // Must return false to indicate that this element is droppable.
            return false;
          }
        })
        .on('dragleave', function() {
          $('#dropMessage p').text('...or drop your data here.');
          $('#gbIcon').css({ 'opacity' : 0.4 });
        })
        .on('drop', function(event) {
          // This should be redundant if our dragover handler is correctly signaling
          // if we are currently droppable.
          if(dropBusy) return false;
          // The next two lines are redundant with 'return false' but protect us
          // against an exception before we return.
          event.stopPropagation();
          event.preventDefault();
          // jQuery events do not expose the new drag-and-drop properties, so
          // we need to dig into the raw DOM event instead.
          var raw = event.originalEvent;
          if(raw.dataTransfer && raw.dataTransfer.files) {
            var files = raw.dataTransfer.files;
            if(files.length != 1) {
              $('#dropMessage p').text('Only one file, please.');
            }
            else {
              var file = files[0];
              log('dropped',file.name,file.type,file.size);
              if(file.type != 'text/xml') {
                $('#dropMessage p').text('Only GreenButton data, please.');
              }
              else if(file.size > 4000000) {
                $('#dropMessage p').text('Maximum size is 4Mb, sorry.');
              }
              else {
                $('#dropMessage p').text('Loading...');
                $.mobile.showPageLoadingMsg();
                var reader = new FileReader();
                reader.onload = function(event) {
                  var text = event.target.result;
                  log('FileReader loaded',text.length,'bytes');
                  try {
                    var xml = $.parseXML(text);
                    dropBusy = self.loadComplete(xml);
                  }
                  catch(e) {
                    log('XML parse error');
                    $('#loadErrorMessage').text("Your data appears to be corrupted (invalid XML).");
                    $('#loadErrorDialog').click();
                  }
                  $('#dropMessage p').text('...or drop your data here.');
                }
                reader.onerror = function() {
                  log('FileReader error');
                  self.loadError();
                  $('#dropMessage p').text('...or drop your data here.');
                }
                reader.readAsText(file);
              }
            }
          }
          return false;
        });
    }
  }

  // Implement the welcome handler.
  $('#loadData').submit(function() {
    var target = $('#dataMenu').val();
    log('target',target);
    // Use the protocol and hostname where the app is running.
    target = location.protocol + '//' + location.hostname + '/gbdata/' + target;
    log('loading',target);
    $('#dropMessage p').text('Loading...');
    $.mobile.showPageLoadingMsg();
    // Start loading the file in the background
    $.ajax({
      type: 'GET',
      url: target,
      dataType: 'xml',
      success: function(xml) {
        self.loadComplete(xml);
      },
      error: function(jqXHR, textStatus, errorThrown) {
        log('ajaxError',textStatus,errorThrown);
        self.loadError();
      }
    });
    return false; // prevent further form submission
  });

  // Implement the intro handler.
  $('#startDemo').click(function() {
    log('starting');
    self.reset();
    $.mobile.changePage($('#demo'));
    // Hide share handler until a login has been confirmed.
    $('#shareButton').button('disable');
  });
  
  // Register reset handler.
  $('#resetButton,#endOfDataDialog').click(function() { self.reset(); });

  // Register jump handler.
  $('#jumpButton').click(function() { self.jump(); });
  
  // Register login handler.
  $('#loginButton').click(function() { facebook.doLoginLogout(); });

  // Register share handler.
  $('#shareButton').click(function() { share(self.module); });

  // Handle resizing of main content area
  $(window).on('orientationchange resize pageshow',function(evt) {
    // hide any iOS toolbar
    window.top.scrollTo(0,1);
    if(self.container.is(':hidden')) return true;
    // lookup our viewport height
    var contentHeight = $(window).height();
    // subtract the height of our header and footer
    contentHeight -= $('[data-role="header"]:visible').outerHeight() +
      $('[data-role="footer"]:visible').outerHeight();
    // subtract any padding and margins
    contentHeight -= self.container.outerHeight() - self.container.height();
    //log('container',evt.type,$(window).height(),contentHeight);
    $('#windowSize').text($(window).width() + ' x ' + $(window).height());
    // set the content height now
    self.container.height(contentHeight);
    // tell any running module to resize itself
    if(self.module) {
      self.module.update(self.container);
    }
  });
}

DemoApp.prototype.loadError = function() {
  $.mobile.hidePageLoadingMsg();
  $('#loadErrorMessage').text('The GreenButton data you requested cannot be loaded.');
  $('#loadErrorDialog').click();
}

DemoApp.prototype.loadComplete = function(xml) {
  log('loadComplete');
  this.data = new GreenButtonData(xml);
  $.mobile.hidePageLoadingMsg();
  if(this.data.errorMessage) {
    // Ajax requested completed ok, but there is a problem with the xml content.
    log('load error',this.data.errorMessage);
    $('#loadErrorMessage').text(this.data.errorMessage);
    $('#loadErrorDialog').click();
    return false;
  }
  else {
    // Everything looks good.
    log('parsed',this.data.nReadings,'readings');
    $.mobile.changePage($('#intro'));
    return true;
  }
}

// De-activates any current module.
DemoApp.prototype.clearModule = function() {
  if(this.module) {
    log('ending',this.module.id);
    this.module.end();
    $('#'+this.module.id+'Select').removeClass('ui-btn-active');
    this.module = null;
  }
  this.container.empty();
  this.container.text('Select an activity using the buttons above...');  
}

DemoApp.prototype.reset = function() {
  // Calculate the offset between current time and our start date.
  log('reset to',this.data.startDate);
  this.data.dateOffset = new Date() - this.data.startDate;
  // Update our location in the dataset.
  this.data.reset();
  // There should not be any active module now.
  this.clearModule();
}

DemoApp.prototype.jump = function() {
  // Calculate a random jump offset in seconds.
  var jumpOffset = (5 + 4*Math.random())*86400;
  // Convert to an index offset.
  var deltaIndex = Math.floor(jumpOffset/this.data.duration);
  // Update our dataset index, coercing to a reasonable time of day.
  var newIndex = this.data.coerceIndex(this.data.current + deltaIndex);
  var newDate = this.data.getDateTime(newIndex);
  log('jump from',this.data.getDateTime(this.data.current),'to',newDate);
  this.data.dateOffset = new Date() - newDate;
  // Did this jump take us beyond the last data?
  if(newDate > this.data.lastDate) {
    $('#endOfDataDialog').click();
  }
  else {
    // Update our location in the dataset.
    this.data.updateCurrent(newIndex);
    // There should not be any active module now.
    this.clearModule();
  }
}
