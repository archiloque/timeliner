/**
 * Timeliner : a tool to draw simple but visually cusomizable timelines
 * Julien Kirch, 2011, under MIT license
 */

/**
 * Create a TimeLiner with the specified parameters.
 * Required params:
 * events: the events to draw, they should contain a date and - if you use the default drawer - a content
 * mainTimeLinerSelector: the selector to find the main timeline
 * Optional parameters:
 * overviewTimeLinerSelector : the selector to find the overview timeline
 * widthPerYear: the number of pixels for one year on the main timeline (default = 200)
 * onClick: the method to be called when the user click on an event, will be passed the event as parameter
 * Advanced parameters:
 * mainDrawer: the method used to draw the events on the main timeline, will be passed the event as parameters, see TimeLiner.simpleMainDrawer for an example
 * overviewDrawer: the method used to draw the events on the overview timeline, will be passed the event as parameters, see TimeLiner.simpleOverviewDrawer for an example
 * pixelsBeforeEvent: the number of pixels between the left of an event div and the place where the event takes place in the timeline
 */
function TimeLiner(initialParams) {
    if (! initialParams.events) {
        alert("No events in the params !");
        return;
    }

    var events = initialParams.events;

    if (! initialParams.mainTimeLinerSelector) {
        alert("No mainTimeLinerSelector in the params !");
        return;
    }

    // get the main timeline
    var mainTimeline = $(initialParams.mainTimeLinerSelector);
    if (mainTimeline.length == 0) {
        alert("Main timeline selector \"" + initialParams.mainTimeLinerSelector + "\" returns no element");
        return;
    }

    var overviewTimeLine = null;
    if (initialParams.overviewTimeLinerSelector) {
        // get the main timeline
        overviewTimeLine = $(initialParams.overviewTimeLinerSelector);
        if (overviewTimeLine.length == 0) {
            alert("Overview timeline selector \"" + params.overviewTimeLiner + "\" returns no element");
            return;
        }
    }

    var defaultParams = {
        // the function used to draw the events on the main timeline.
        "mainDrawer": TimeLiner.simpleMainDrawer,
        // the number of pixels between the left of an event div and the place where the event takes place in the timeline
        // for example may be half the width of the icon used to indicate the event
        "pixelsBeforeEvent": 2,

        // the number of pixels for one year on the main timeline
        "widthPerYear": 200,

        // the function used to draw the events on the overview timeline.
        "overviewDrawer": TimeLiner.simpleOverviewDrawer
    };

    // add the default params
    var params = $.extend({}, defaultParams, initialParams);

    var timeLinerMain = $("<div class='tlMain' style='height:" + mainTimeline.height() + ";'></div>").prependTo(mainTimeline);

    // check if all the events have a date
    $.each(events, function(index, event) {
        if (! event.date) {
            alert("Event \"" + event + "\" have no date");
        }
    });


    var minYear = events[0].date.getFullYear();
    var maxYear = events[events.length - 1].date.getFullYear();

    // create the divs for each year
    for (var i = 0; i <= (maxYear - minYear); i++) {
        // background block
        timeLinerMain.append("<div class='tlMainTimeBlock' style='width:" + params.widthPerYear + "px;left:" + (i * params.widthPerYear) + "px;'></div>")
        // the year number
        timeLinerMain.append("<div class='tlMainDate' style='width:" + params.widthPerYear + "px;left:" + (i * params.widthPerYear) + "px;'>" + (minYear + i) + "</div>")
    }

    // create the events
    var existingEvents = [];
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        var eventDate = event.date;
        var left = Math.ceil((eventDate.getFullYear() - minYear + (eventDate.getDOY() / 365)) * params.widthPerYear) - params.pixelsBeforeEvent;


        var eventContent = params.mainDrawer(event);
        var newEvent = $("<div class='tlMainEvent' style='left:" + left + "px;'>" + eventContent + "</div>").prependTo(timeLinerMain);
        if (params.onClick) {
            newEvent.click(params.onclick(event)).addClass('.tlClickable');
        }

        // we will calculate where to draw the event by checking for overlays
        var myLeft = newEvent.position().left;
        var myRight = myLeft + newEvent.width();
        var top = 0;
        for (var j = 0; j < existingEvents.length; j++) {
            // current event
            var cEvent = existingEvents[j];
            var cLeft = cEvent.position().left;
            var cRight = cLeft + cEvent.width();

            var overlay = ((cLeft <= myLeft) && (myLeft <= cRight)) || ((cLeft <= myRight) && (myRight <= cRight)) || ((myLeft >= cLeft) && (myRight <= cRight));
            if (overlay) {
                top = Math.max(top, cEvent.position().top + cEvent.height());
            }
        }
        if (top != 0) {
            newEvent.css('top', top + "px");
        }
        existingEvents.push(newEvent);
    }

    // draw the overview
    if (overviewTimeLine) {

        var timeLinerOverview = $("<div class='tlOverview' style='height:" + overviewTimeLine.height() + ";'></div>").prependTo(overviewTimeLine);

        // calculate the width of each year
        var numberOfYears = (1 + maxYear - minYear);
        var widthForEachYear = Math.ceil((overviewTimeLine.width() - 15) / numberOfYears);
        // add one more year to go to the end of the page
        if ((widthForEachYear * numberOfYears) < overviewTimeLine.width()) {
            numberOfYears++;
        }

        // create the div for each year
        for (i = 0; i <= numberOfYears; i++) {
            // background block
            timeLinerOverview.append("<div class='tlOverviewTimeBlock' style='width:" + widthForEachYear + "px;left:" + (i * widthForEachYear) + "px;'></div>")
            // the year number
            timeLinerOverview.append("<div class='tlOverviewDate' style='width:" + widthForEachYear + "px;left:" + (i * widthForEachYear) + "px;'>" + (minYear + i) + "</div>")
        }

        // create the events
        existingEvents = [];
        for (i = 0; i < events.length; i++) {
            event = events[i];
            eventDate = event.date;
            left = Math.ceil((eventDate.getFullYear() - minYear + (eventDate.getDOY() / 365)) * widthForEachYear);
            eventContent = params.overviewDrawer(event);
            newEvent = $("<div class='tlOverviewEvent' style='left:" + left + "px;'>" + eventContent + "</div>").prependTo(timeLinerOverview);

        }

        // scrolling when clicking on the overview
        timeLinerOverview.click(function(event) {
            // calculate the position of the point in the main timeline coordinate system
            var positionOnMain = (((event.pageX - timeLinerOverview.offset().left ) / widthForEachYear) * params.widthPerYear);
            // add half a screen to center the point
            positionOnMain -= mainTimeline.width() / 2;

            if (positionOnMain < 0) {
                timeLinerMain.scrollTo({ top: 0, left: 0}, 800);
            } else {
                timeLinerMain.scrollTo({ top: 0, left: positionOnMain}, 800);
            }
        });
    }


    // scrolling grabbed from http://jqueryfordesigners.com/fun-with-overflows/
    timeLinerMain.mousedown(
                           function (event) {
                               // attach 3 pieces of data to the #timeline element
                               $(this)
                                       .data('down', true)// a flag indicating the mouse is down
                                       .data('x', event.clientX)// the current mouse down X coord
                                       .data('scrollLeft', this.scrollLeft); // the current scroll position

                               // return false to avoid selecting text and dragging links within the scroll window
                               return false;
                           });
    timeLinerMain.mouseup(
                         function (event) {
                             // on mouse up, cancel the 'down' flag
                             $(this).data('down', false);
                         });
    timeLinerMain.mousemove(
                           function (event) {
                               // if the mouse is down - start the drag effect
                               if ($(this).data('down')) {
                                   // this.scrollLeft is the scrollbar caused by the overflowing content
                                   // the new position is: original scroll position + original mouse down X - new X
                                   // I'd like to see if anyone can give an example of how to speed up the scroll.
                                   this.scrollLeft = $(this).data('scrollLeft') + $(this).data('x') - event.clientX;
                               }
                           });
    timeLinerMain.mousewheel(
                            function (event, delta) {
                                // now attaching the mouse wheel plugin and scroll by the 'delta' which is the
                                // movement of the wheel - so we multiple by an arbitrary number.
                                this.scrollLeft -= (delta * 30);
                            }).css({
                                       'overflow' : 'hidden', // change to hidden for JS users
                                       'cursor' : '-moz-grab' // add the grab cursor
                                   });

// finally, we want to handle the mouse going out of the browser window and
// it not triggering the mouse up event (because the mouse is still down)
// but it messes up the tracking of the mouse down
    $(window).mouseout(function (event) {
        if (timeLinerMain.data('down')) {
            try {
                // *try* to get the element the mouse left the window by and if
                // we really did leave the window, then cancel the down flag
                if (event.originalTarget.nodeName == 'BODY' || event.originalTarget.nodeName == 'HTML') {
                    timeLinerMain.data('down', false);
                }
            } catch (e) {
            }
        }
    });
}

/**
 * The default main drawer, require the events to have a content parameter.
 * @param event the event to be drawn.
 * @return the html code that represents the event.
 */
TimeLiner.simpleMainDrawer = function(event) {
    if (! event.content) {
        alert("Event " + event + " don't have a content parameter");
        return null;
    }
    return "<div><img src='lib/mainEvent.gif'>" + event.content + "</div>";
};
/**
 * The default overview drawer.
 * @param event the event to be drawn.
 * @return the html code that represents the event.
 */
TimeLiner.simpleOverviewDrawer = function(event) {
    return "<div><img src='lib/overviewEvent.png'></div>";
};

Date.prototype.getDOY = function() {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((this - onejan) / 86400000);
};
