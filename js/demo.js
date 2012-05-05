function DemoApp() {
  this.data = null;
  this.dateOffset = 0;
  this.modules = [ ];
  this.module = null;
  this.container = $('#moduleContent');
}

DemoApp.prototype.start = function() {

  // Use 'self' as an alias for 'this' when we are in a context that hides 'this'
  var self = this;
  
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

  // Implement the welcome handler.
  $('#loadData').submit(function() {
    var target = $('input[name=url]').val();
    log('loading',target);
    $.mobile.showPageLoadingMsg();
    // Start loading the file in the background
    $.ajax({
      type: 'GET',
      url: target,
      dataType: 'xml',
      success: function(xml) {
        log('loaded');
        self.data = new GreenButtonData(xml);
        $.mobile.hidePageLoadingMsg();
        if(self.data.errorMessage) {
          // Ajax requested completed ok, but there is a problem with the xml content.
          log('load error',self.data.errorMessage);
          $('#loadErrorMessage').text(self.data.errorMessage);
          $('#loadErrorDialog').click();
        }
        else {
          // Everything looks good.
          log('parsed',self.data.nReadings,'readings');
          $.mobile.changePage($('#intro'));
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        // Ajax request resulted in an error.
        log('error',textStatus,errorThrown);
        $.mobile.hidePageLoadingMsg();
        $('#loadErrorMessage').text('The GreenButton data you requested cannot be loaded.');
        $('#loadErrorDialog').click();
      }
    });
    return false; // prevent further form submission
  });

  // Implement the intro handler.
  $('#startDemo').click(function() {
    log('starting');
    self.reset();
    $.mobile.changePage($('#demo'));
  });
  
  // Register reset handler.
  $('#resetButton,#endOfDataDialog').click(function() { self.reset(); });

  // Register jump handler.
  $('#jumpButton').click(function() { self.jump(); });

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
  
  // Use the protocol and hostname where the app is running for the datafile default
  $('#url').val(location.protocol+'//'+location.hostname+'/gbdata/demo.xml');
}

// Returns the current simulation time, based on an offset real-time clock.
DemoApp.prototype.getSimulationTime = function() {
  var now = new Date();
  return new Date(now.getTime() - this.dateOffset);
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
  this.dateOffset = new Date() - this.data.startDate;
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
  this.dateOffset = new Date() - newDate;
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
