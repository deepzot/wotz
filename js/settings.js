function Settings() {
  self = this;
  // Fetch the target URL for the "More Info..." button on our "About" dialog.
  this.moreInfoURL = $('#moreInfo').attr('href');
  // Start loading our consumption database in the background.
  this.consumptionByCounty = null;
  d3.csv('california.csv',function(rows) {
    self.consumptionByCounty = rows;
    var menu = $('#countyMenu');
    // Remove the static placeholder option.
    menu.empty();
    // Add an option for each row.
    for(var k = 0; k < rows.length; ++k) {
      var row = rows[k];
      var option = $('<option value="'+k+'">'+row.n+'</option>').appendTo(menu);
      if(row.n == "San Diego County, California") option.attr('selected', 'selected');
    }
  });
  // Get our initial settings from the form.
  this.update();
  // Add settings form handlers.
  $('#serviceTypeMenu input').change(function() {
    self.update();
  });
  $('#settingsForm input[type="submit"]').click(function() {
    if(self.serviceType == 'residential') {
      self.peopleCount = $('#householdCount').val();
    }
    else {
      self.peopleCount = $('#employeeCount').val();
    }
    // Look up data for the selected county.
    var countyIndex = $('#countyMenu option:selected').val();
    if(countyIndex == -1 || self.consumptionByCounty == null || countyIndex >= self.consumptionByCounty.length) {
      // It looks like our external data isn't available. Use 2010 San Diego County data.
      self.countyName = 'San Diego County, California';
      self.consumptionRatePerCapita = self.serviceType == 'residential' ? 0.24277 : 1.24571;
    }
    else {
      var row = self.consumptionByCounty[countyIndex];
      self.countyName = row.n;
      self.consumptionRatePerCapita = self.serviceType == 'residential' ? row.r : row.c;
    }
    // Validate the people count input (should really highlight field, etc, here)
    self.peopleCount = parseInt(self.peopleCount) || 1;

    // Calculate the total average consumption rate for this county and type of service.
    self.consumptionRate = self.peopleCount*self.consumptionRatePerCapita;

    // Embed settings info in our "About" dialog.    
    $('#aboutSettings').text('Average '+self.serviceType+' consumption by '+self.peopleCount+
      (self.serviceType=='residential'?' people':' employees')+' in '+self.countyName+' is '+
      d3.format('.1f')(24*self.consumptionRate)+' kWh/day.');

    log('settings',countyIndex,self.serviceType,self.peopleCount,self.consumptionRate);
  });
}

Settings.prototype.update = function() {
  // Synchronize the visibility of the household size / number of employees inputs
  // with the current residential / commercial selection.
  this.serviceType = $('#serviceTypeMenu input:checked').val();
  if(this.serviceType == 'residential') {
    $('#householdCountInput').show();    
    $('#employeeCountInput').hide();
  }
  else {
    $('#householdCountInput').hide();    
    $('#employeeCountInput').show();
  }
}