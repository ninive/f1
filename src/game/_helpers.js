var helpers = {
    lap: 0,
    lastLap: [],
    emitFinish: function() {

        helpers.lap = helpers.lap + 1;
        helpers.lastLap[helpers.lap] = timer.ms;

        //console.log(helpers.lastLap);

        // Re-Use Beacon to short waiting time.
        // Last - Now (timing) + Db.

        /*
        minutes = Math.floor(game.time.time / 60000) % 60;
        seconds = Math.floor(game.time.time / 1000) % 60;
        milliseconds = Math.floor(game.time.time) % 100;
     
        if (milliseconds < 10)
            milliseconds = '0' + milliseconds; 
        if (seconds < 10)
            seconds = '0' + seconds;
        if (minutes < 10)
            minutes = '0' + minutes;
        timer = minutes + ':'+ seconds + ':' + milliseconds;
        */
    },
    emitSlower: function() {
       car.body.maxVelocity.setTo(150, 150);
    },
    handleOrientation: function(e) {
        // Device Orientation API
        var x = e.gamma; // range [-90,90], left-right
        var y = e.beta;  // range [-180,180], top-bottom
        var z = e.alpha; // range [0,360], up-down
        car.angle += y*0.1;
        state.rpm -= x*0.2;
    },
    throttle: function(func, wait, options) { // _throttle from the src. Only solution i've found to hack Multiple Overlaps.
    
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    }
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    }
    }

};