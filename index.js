//require('dotenv').load();
var express = require('express');
var suncalc = require('suncalc');
var ct = require('color-temperature');
var onecolor = require('onecolor');


var app = express();

app.use(express.static('public'));
app.set('views', __dirname+'/views');
app.set('view engine', 'jade');

// f.lux presets, for example
//Ember: 1200K
//Candle: 1900K
//Warm Incandescent: 2300K
//Incandescent: 2700K
//Halogen: 3400K
//Fluorescent: 4200K
//Daylight: 5500K
var getTimes = function(dateTime, lat, long){
  
  // get events as date objects
  /* 
  https://github.com/mourner/suncalc
  returns an object with the following Date object properties:
    sunrise sunrise (top edge of the sun appears on the horizon)
    sunriseEnd  sunrise ends (bottom edge of the sun touches the horizon)
    goldenHourEnd morning golden hour (soft light, best time for photography) ends
    solarNoon solar noon (sun is in the highest position)
    goldenHour  evening golden hour starts
    sunsetStart sunset starts (bottom edge of the sun touches the horizon)
    sunset  sunset (sun disappears below the horizon, evening civil twilight starts)
    dusk  dusk (evening nautical twilight starts) 
    nauticalDusk  nautical dusk (evening astronomical twilight starts)
    night night starts (dark enough for astronomical observations)
    nadir nadir (darkest moment of the night, sun is in the lowest position)
    nightEnd  night ends (morning astronomical twilight starts)
    nauticalDawn  nautical dawn (morning nautical twilight starts)
    dawn  dawn (morning nautical twilight ends, morning civil twilight starts)
  */
  var times = suncalc.getTimes(dateTime, lat, long);
  return times
};

var setEvents = function(times, lat, long){ 
  // Set sunrise 2000k
  // Set twilight 3500k
  // Set early morning 4300k
  // Set afternoon 6000k
  // Set late afternoon 4300k
  // Set twilight 3500k
  // Set sunset 2000k
  // Events we care about for light gradients
  var events = {
    dawn : {
      temp: 1800,
      rgb: ct.colorTemperature2rgb(1800)
    },
    sunrise: {
      temp: 2000,
      rgb: ct.colorTemperature2rgb(2000)
    },
    goldenHourEnd: {
      temp: 3600,
      rgb: ct.colorTemperature2rgb(3600),
    },
    solarNoon: {
      temp: 6000,
      rgb: ct.colorTemperature2rgb(6000)
    },
    goldenHour: {
      temp: 3300,
      rgb: ct.colorTemperature2rgb(3300)      
    },
    sunset: {
      temp: 2000,
      rgb: ct.colorTemperature2rgb(2000)
    },
    dusk: {
      temp: 1800,
      rgb: ct.colorTemperature2rgb(1800)
    }
  };
  for (var event in events){
    events[event].dateTime = times[event];
    // sun azimuth (direction along the horizon, measured from south to west), e.g. 0 is south and Math.PI * 3/4 is northwest
    // in degrees
    events[event].azimuth = (suncalc.getPosition(times[event], lat, long)).azimuth * 180 / Math.PI;
  }
  return events
};

var setColors = function(events){
  rgbStr = function(rgb){
    return 'rgb(' + rgb.red + ',' + rgb.green + ',' + rgb.blue + (')')
  }
  for (var event in events){
    color = onecolor(rgbStr(events[event].rgb));
    events[event].hex = color.hex();
    events[event].hsv = color.hsv();
    events[event].cmyk = color.cmyk();
  }
  
  return events
};

// Gradient constructor
var buildGradient = function(events){
  keys = Object.keys(events)
  // Color stops. Max: 1 / minute
  for (var i=0; i < keys.length; i++){
    current = keys[i]
    next = keys[i+1]
    if (next == undefined){ next = 'dawn'}
    // in ms
    var diff = events[current].dateTime - events[next].dateTime;
    // ms / 60,000 == m
    diff = Math.round(diff/60,000);
    console.log(diff)
    //events[i].gradient = Gradient(events[i].hex, events[i+1].hex, diff);
  }
  return events
  // dawn, sunrise, goldenHourEnd, solarNoon, goldenHour, sunset, dusk
};

// Events Constructor
var buildColors = function(events){
    events = setColors(events);
    events = buildGradient(events);
    return events
}

app.get('/', function(req, res, next){
  res.render('index')
  // /times = getTimes(new Date(), )
  //dateTime = req.query.dateTime;
  //lat = req.query.lat;
  //long = req.query.long;
  //res.render('index', {time: dateTime, kelvin: temp.kelvin, rgb: temp.rgb, hex: temp.hex, cmyk: temp.cmyk});
});

app.get('/api/v1/gradient', function(req, res, next){
  if (!req.query.lat || !req.query.long){
    res.status(500).json({error: 'You must specify lat & long coordinates. Example: ?lat=30.342&long=-78.123'})
  }
  else{
    times = getTimes(new Date(), req.query.lat, req.query.long);
    events = setEvents(times, req.query.lat, req.query.long);
    data = buildColors(events);
    res.status(200).json(data)
  }
  // 
});
app.get('/api/v1/preset', function(req, res, next){

});

var server = app.listen(3000, function(){
var host = server.address().address;
var port = server.address().port;
});