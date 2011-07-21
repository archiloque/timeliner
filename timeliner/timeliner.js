/**
 * Timeliner : a tool to draw simple but visually cusomizable timelines
 * Julien Kirch, 2011, under MIT license
 * except part from http://jqueryfordesigners.com/fun-with-overflows/
 */

/**
 * Create a TimeLiner with the specified parameters.
 *
 * Required params:
 * events: an array containing the events to draw, they should contain a date property and - if you use the default drawer - a content property returning the html to use for display
 * mainTimeLinerSelector: the jQuery selector to find the main timeline
 *
 * Optional parameters:
 * overviewTimeLinerSelector: the jQuery selector to find the overview timeline
 * mainDrawer: the method used to create the html representing an event on the main timeline, will be passed the event as parameters and should return the HTML used to represent the event, see TimeLiner.simpleMainDrawer for an example
 * overviewDrawer: the method used to create the html representing an event on the overview timeline, will be passed the event as parameters, see TimeLiner.simpleOverviewDrawer for an example
 * leftArrowSelector: the jQuery selector to find the left arrow used to to scroll the main timeline
 * rightArrowSelector: the selector to find the right arrow used to to scroll the main timeline
 * numberOfPixelsPerArrowClick : the number of pixels to move the timeline when clicking on an arrow, default to 800
 * widthPerYear: the number of pixels for one year on the main timeline, default to 200
 * onClickEvent: the method to be called when the user click on an event, will be passed the event as parameter, example: function(event) { alert("You clicked on " + event.name); }
 * pixelsBeforeFirstDateOverview: number of pixels before the first year in the overview, so the border of the first year is displayed, default to 3
 *
 * Advanced parameters:
 * numberOfPixelsForYear: the method to be called to calculate the number of pixels for a year, replace the widthPerYear value, will be passed the timeline params and the year.
 * pixelsBeforeEvent: the number of pixels between the left of an event div and the place where the event takes place in the timeline, may be half the width of the icon used to precisely indicate the event
 * timeBlocksAndDatesOverlay : if the time blocks and date div should overlay or not, help doing some design tricks, default to true.
 * numberOfPixelsToDate: the method to be called to calculate the number of pixels from the left a date should be placed, replace the widthPerYear value, will be passed the timeline params, the first year, and a date.
 * dateToNumberOfPixels: the method to be called to calculate the date corresponding to a position on the main timeline, replace the widthPerYear value, will be passed the timeline params, the first year, and a number of pixels.
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
        "mainDrawer": TimeLiner.simpleMainDrawer,
        "pixelsBeforeEvent": 2,
        "widthPerYear": 200,
        "numberOfPixelsToDate": TimeLiner.simpleNumberOfPixelsToDate,
        "dateToNumberOfPixels": TimeLiner.simpleDateToNumberOfPixels,
        "numberOfPixelsForYear": TimeLiner.simpleNumberOfPixelsForYear,
        "overviewDrawer": TimeLiner.simpleOverviewDrawer,
        "pixelsBeforeFirstDateOverview": 3,
        "timeBlocksAndDatesOverlay": true,
        "numberOfPixelsPerArrowClick": 800
    };

    // add the default params
    var params = $.extend({}, defaultParams, initialParams);

    // check if all the events have a date
    $.each(events, function(index, event) {
        if (! event.date) {
            alert("Event \"" + event + "\" have no date");
        }
    });

    var timeLinerMain = $("<div class='tlMain' style='height:" + mainTimeline.height() + "px;'></div>").appendTo(mainTimeline);
    var minYear = events[0].date.getFullYear();
    var maxYear = events[events.length - 1].date.getFullYear();

    // create the divs for each year
    var currentX = 0;
    for (var i = 0; i <= (maxYear - minYear) + 1; i++) {
        // the year number
        var currentYearWith = params.numberOfPixelsForYear(params, i + minYear);

        var year = $("<div class='tlMainDate' style='width:" + currentYearWith + "px;left:" + currentX + "px;'>" + (minYear + i) + "</div>").appendTo(timeLinerMain);
        var heightStyle = mainTimeline.height() - (params.timeBlocksAndDatesOverlay ? 0 : year.outerHeight(true));
        // background block
        timeLinerMain.append("<div class='tlMainTimeBlock' style='width:" + currentYearWith + "px;left:" + currentX + "px;height:" + heightStyle + "px;'></div>");

        currentX += currentYearWith;
    }

    // create the events
    var existingEvents = [];
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        var left = params.dateToNumberOfPixels(params, minYear, event.date) - params.pixelsBeforeEvent;

        var eventContent = params.mainDrawer(event);
        var newEvent = $("<div class='tlMainEvent'>" + eventContent + "</div>").appendTo(timeLinerMain);
        var width = (newEvent.outerWidth(true) + 10);
        newEvent.css('min-width', width + "px");
        newEvent.css('left', left + "px");
        if (params.onClickEvent) {
            newEvent.click({"event": event, "f": params.onClickEvent},
                          function(params) {
                              params.data.f(params.data.event);
                          }
                    ).addClass('tlClickable');
        }

        // we will calculate where to draw the event by checking for overlays
        var height = newEvent.outerHeight(true);
        var e = {"top": 0, "left": left, "right": left + width, "bottom": height};

        TimeLiner.noOverlay(e, height, existingEvents);
        if (e.top != 0) {
            newEvent.css('top', e.top + "px");
        }
        existingEvents.push(e);
        existingEvents.sort(function(a, b) {
            return a.top - b.top;
        });
    }

    if (params.leftArrowSelector) {
        $(params.leftArrowSelector).click(
                                         function() {
                                             timeLinerMain.scrollTo({ top: 0, left: '-=' + params.numberOfPixelsPerArrowClick + 'px'}, 800);
                                         }).addClass('tlClickable');
    }
    if (params.rightArrowSelector) {
        $(params.rightArrowSelector).click(
                                          function() {
                                              timeLinerMain.scrollTo({ top: 0, left: '+=' + params.numberOfPixelsPerArrowClick + 'px'}, 800);
                                          }).addClass('tlClickable');
    }

    // draw the overview
    if (overviewTimeLine) {

        var timeLinerOverview = $("<div class='tlOverview tlClickable' style='height:" + overviewTimeLine.height() + "px;'></div>").appendTo(overviewTimeLine);

        // calculate the width of each year
        var numberOfYears = (1 + maxYear - minYear);
        var widthForEachYear = Math.ceil((overviewTimeLine.outerWidth(true) - (15 + params.pixelsBeforeFirstDateOverview)) / numberOfYears);
        // add one more year to go to the end of the page
        if ((widthForEachYear * numberOfYears) < overviewTimeLine.outerWidth(true)) {
            numberOfYears++;
        }

        var dateToPixelForOverview = function(date) {
            return Math.ceil((date.getFullYear() - minYear + (date.getDOY() / 365)) * widthForEachYear);
        };

        var displayedZone = $("<div class='tlDisplayedZone'></div>").appendTo(timeLinerOverview);
        timeLinerMain.scroll(function() {
            var date1 = params.numberOfPixelsToDate(params, minYear, timeLinerMain.scrollLeft());
            var x1 = dateToPixelForOverview(date1);
            var date2 = params.numberOfPixelsToDate(params, minYear, timeLinerMain.scrollLeft() + mainTimeline.width());
            var x2 = dateToPixelForOverview(date2);
            displayedZone.css('left', x1);
            displayedZone.css('width', x2 - x1);
        });
        timeLinerMain.scroll();

        // create the div for each year
        for (i = 0; i <= numberOfYears; i++) {
            // background block
            left = params.pixelsBeforeFirstDateOverview + (i * widthForEachYear);
            timeLinerOverview.append("<div class='tlOverviewTimeBlock' style='width:" + widthForEachYear + "px;left:" + left + "px;'></div>");
            // the year number
            timeLinerOverview.append("<div class='tlOverviewDate' style='width:" + widthForEachYear + "px;left:" + left + "px;'>" + (minYear + i) + "</div>")
        }

        // create the events
        existingEvents = [];
        for (i = 0; i < events.length; i++) {
            event = events[i];
            eventDate = event.date;
            left = params.pixelsBeforeFirstDateOverview + dateToPixelForOverview(eventDate);
            eventContent = params.overviewDrawer(event);
            newEvent = $("<div class='tlOverviewEvent' style='left:" + left + "px;'>" + eventContent + "</div>").appendTo(timeLinerOverview);

            width = newEvent.outerWidth(true);
            newEvent.css('min-width', width + "px");
            newEvent.css('left', left + "px");
            if (params.onClick) {
                newEvent.click(params.onclick(event)).addClass('.tlClickable');
            }

            // we will calculate where to draw the event by checking for overlays
            height = newEvent.outerHeight(true);
            e = {"top": 0, "left": left, "right": left + width, "bottom": height};

            TimeLiner.noOverlay(e, height, existingEvents);
            if (e.top != 0) {
                newEvent.css('top', e.top + "px");
            }
            existingEvents.push(e);
            existingEvents.sort(function(a, b) {
                return a.top - b.top;
            });
        }

        // scrolling when clicking on the overview
        timeLinerOverview.click(function(event) {
            // calculate the position of the point in the main timeline coordinate system
            var numberOfYears = (event.pageX - timeLinerOverview.offset().left ) / widthForEachYear;
            var clickedDate = new Date((minYear + numberOfYears - 1970) * TimeLiner.SECONDS_IN_A_YEAR);
            var positionOnMain = params.dateToNumberOfPixels(params, minYear, clickedDate);
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
                         function () {
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
 * Move an event to the bottom till there is no overlay with other events.
 * @param e the event.
 * @param height the event's height
 * @param existingEvents the already positioned events.
 */
TimeLiner.noOverlay = function(e, height, existingEvents) {
    for (var j = 0; j < existingEvents.length; j++) {
        // current event
        var c = existingEvents[j];
        if (((c.left <= e.left ) && (e.left <= c.right)) || ((c.left <= e.right) && (e.right <= c.right)) || ((e.left >= c.left) && (e.right <= c.right))) {
            if (((c.top <= e.top) && (e.top <= c.bottom)) || ((c.top <= e.bottom) && (e.bottom <= c.bottom)) || ((e.top >= c.top) && (e.bottom <= c.bottom))) {
                e.top = Math.max(e.top, c.bottom);
                e.bottom = e.top + height;
            }
        }
    }
};

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
    return "<div><img class='defaultMainEvent' src='timeliner/mainEvent.gif'>" + event.content + "</div>";
};

/**
 * The default overview drawer.
 * @param event the event to be drawn.
 * @return the html code that represents the event.
 */
TimeLiner.simpleOverviewDrawer = function(event) {
    return "<div><img src='timeliner/overviewEvent.png'></div>";
};

/**
 * The number of pixels from the left a date should be placed.
 * @param params the timeline params.
 * @param minYear the first year to be displayed.
 * @param date the date.
 */
TimeLiner.simpleDateToNumberOfPixels = function(params, minYear, date) {
    return Math.ceil((date.getFullYear() - minYear + (date.getDOY() / 365)) * params.widthPerYear);
};

/**
 * The date corresponding to a number of pixels.
 * @param params the timeline params.
 * @param minYear the first year to be displayed.
 * @param pixelsNumber the number of pixels.
 */
TimeLiner.simpleNumberOfPixelsToDate = function(params, minYear, pixelsNumber) {
    return new Date((minYear + (pixelsNumber / params.widthPerYear) - 1970) * TimeLiner.SECONDS_IN_A_YEAR);
};

TimeLiner.SECONDS_IN_A_YEAR = 31557032762;

/**
 * The number of pixels for a year.
 * @param params the timeline params.
 * @param year the year.
 * @return the number of pixels for a year.
 */
TimeLiner.simpleNumberOfPixelsForYear = function(params, year) {
    return params.widthPerYear;
};

Date.prototype.getDOY = function() {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((this - onejan) / 86400000);
};
