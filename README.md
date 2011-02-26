# Timeliner: a designer-friendly javascript timeline drawing tool

Timeliner is a simple javascript timeline drawing tool aimed at easy visual customization: you should be able to obtain the visual appearance you want using only the provided parameters and some css; and for cases where you need to edit the library code directly it should be plain and short enough to do it without hassle.

A timeline is composed of 2 elements:

* the main component where the events are displayed, often it's larger than the screen
* an overview displaying the full time range on one screen using icons for the events with a highlighted zone that indicates the part displayed on the main view

# A Quick Example

You can draw a simple timeline by providing the events, a jQuery selector for the main component and an optional jQuery selector for the overview:

    <html>
    <head>
        <meta http-equiv="content-type" content="text/html; charset=utf-8">
        <title>TimeLiner sample</title>
        <script src="timeliner/jquery-1.4.4.min.js" type="text/javascript">
        </script>
        <script src="timeliner/jquery.mousewheel.min.js" type="text/javascript">
        </script>
        <script src="timeliner/jquery.scrollTo-1.4.2-min.js" type="text/javascript">
        </script>
        <script src="timeliner/timeliner.js" type="text/javascript">
        </script>
        <link rel="stylesheet" href="timeliner/timeliner-structure.css" type="text/css">
        <link rel="stylesheet" href="timeliner/timeliner-custom.css" type="text/css">

        <style type="text/css">
            #title {
                text-align: center;
            }

            #myMainTimeLine {
                width: 100%;
                height: 400px;
                background-color: #eeeeee;
            }
            #myOverviewTimeLine {
                width: 100%;
                height: 25px;
                padding-top: 10px;
                background-color: #f5f5f5;
                font-size: 10px;
            }
        </style>
        <script type="text/javascript">
            $(function() {
                var events = [
                    {"date": new Date(2001, 1, 0),
                        "content": "first event !"},
                    {"date": new Date(2001, 5, 10),
                        "content": "another event"},
                    {"date": new Date(2001, 2, 5),
                        "content": "a third event<br>on two lines"},
                    {"date": new Date(2001, 4, 15),
                        "content": "another one"},
                    {"date": new Date(2010, 1, 5),
                        "content": "event"},
                    {"date": new Date(2012, 5, 5),
                        "content": "again"},
                    {"date": new Date(2012, 11, 31),
                        "content": "a last one"}
                ];
                new TimeLiner(
                    {"events" : events,
                    "mainTimeLinerSelector": "#myMainTimeLine",
                    "overviewTimeLinerSelector": "#myOverviewTimeLine"});
            });
        </script>
    </head>
    <body>
    <h1 id="title">TimeLine sample</h1>

    <div id="myMainTimeLine"></div>
    <div id="myOverviewTimeLine"></div>
    </body>
    </html>

This example can be seen at [http://archiloque.net/timeliner/example.html](http://archiloque.net/timeliner/example.html)

# More elaborate examples:

TODO: add examples when they'll be published

# How it works

When a timeline is instantiated, each element is created at its target horizontal position according to its date, then moved down until we find a space large enough to not overlay with existing events.

AS elements are created using the order they are provided in the parameters the first elements will be displayed above the following ones. This can be used to choose which elements should be emphasized by being on the timeline's top.

## On external resources:

As the timeline is created as soon as the DOM is ready you must:

* provide images sizes using stylesheets
* define sensible fallback when using web fonts (the fallback should have roughly the same size)

Because when the events' positions is calculated *the images and font may not have been downloaded yet*, you have to provide the browser enough information to calculate the elements size without these resources, or instead the display would be wrong.

# Available Parameters and usages

## Required Parameters

* events: the events to draw, they should contain a date property and - if you use the default drawer - a content property returning the html to use for display
* mainTimeLinerSelector: the jQuery selector to find the main timeline

## Optional parameters

* overviewTimeLinerSelector: the jQuery selector to find the overview timeline

* mainDrawer: the method used to draw the events on the main timeline, will be passed the event as parameters and should return the HTML used to represent the event, see TimeLiner.simpleMainDrawer for an example
* overviewDrawer: the method used to draw the events on the overview timeline, will be passed the event as parameters and should return the HTML used to represent the event, see TimeLiner.simpleOverviewDrawer for an example

* leftArrowSelector: the jQuery selector to find the left arrow used to to scroll the main timeline
* rightArrowSelector: the jQuery selector to find the right arrow used to to scroll the main timeline
* numberOfPixelsPerArrowClick : the number of pixels to move the timeline when clicking on an arrow, default to 800

* widthPerYear: the number of pixels for one year on the main timeline, default to 200
* onClickEvent: the method to be called when the user click on an event, will be passed the event as parameter
* pixelsBeforeFirstDateOverview : number of pixels before the first year in the overview, so the border of the first year is displayed, default to 3

## Advanced parameters:

* pixelsBeforeEvent: the number of pixels between the left of an event div and the place where the event takes place in the timeline, may be half the width of the icon used to precisely indicates the event
* timeBlocksAndDatesOverlay : if the time blocks and date div should overlay or not, help doing some design tricks, default to true.

* numberOfPixelsToDate : the method to be called to calculate the number of pixels from the left a date should be placed, replace the widthPerYear value, will be passed the timeline params, the first year, and a date.
* dateToNumberOfPixels : the method to be called to calculate the date corresponding to a position on the main timeline, replace the widthPerYear value, will be passed the timeline params, the first year, and a number of pixels.
* numberOfPixelsForYear : the method to be called to calculate the number of pixels for a year, replace the widthPerYear value, will be passed the timeline params and the year.

The 3 last parameters are used when you need the time scale to change along the timeline and should be used together.

For example if you want the years to use more widths after a certain date:

    var normalYearWidth = 75;
    var extendedYearWidth = 300;
    var switchYear = 2008;

    new TimeLiner({
        // ...
        "numberOfPixelsForYear": function(params, year) {
            return (year <= switchYear) ? normalYearWidth : extendedYearWidth;
        },
        "dateToNumberOfPixels": function(params, minYear, date) {
            if (date.getFullYear() <= switchYear) {
                return Math.ceil((date.getFullYear() - minYear + (date.getDOY() / 365)) * normalYearWidth);
            } else {
                var numberOfPixelsBeforeSwitch = ((switchYear - (minYear - 1)) * normalYearWidth);
                return numberOfPixelsBeforeSwitch + Math.ceil((date.getFullYear() - (switchYear + 1 ) + (date.getDOY() / 365)) * extendedYearWidth)
            }
        },
        "numberOfPixelsToDate": function(params, minYear, pixelsNumber) {
            var numberOfPixelsBeforeSwitch = ((switchYear - (minYear - 1)) * normalYearWidth);
            if (pixelsNumber < numberOfPixelsBeforeSwitch) {
                return new Date((minYear + (pixelsNumber / normalYearWidth) - 1970) * TimeLiner.SECONDS_IN_A_YEAR);
            } else {

                return new Date((((pixelsNumber - numberOfPixelsBeforeSwitch ) / extendedYearWidth) + (switchYear - 1969)) * TimeLiner.SECONDS_IN_A_YEAR);
            }
    }};


# HTML Elements for CSS customization

Here are the HTML created by the timelines:

* .tlMain: the main timeline
* .tlOverview: the overview timeline
* .tlMainTimeBlock: the blocks representing the years in the background of the main timeline
* .tlMainDate: the dates in the main timeline
* .tlMainEvent: the events on the main timeline
* .tlOverviewTimeBlock: the block of time in the background of the overview timeline
* .tlOverviewDate: the dates of the overview timeline
* .tlDisplayedZone: in the overview timeline show the time period currently displayed in the main timeline

The timeliner-custom.css file contain some default formatting for them, you can use this file to start working on your markup.

# Dependencies

It relies on:

* jQuery
* jQuery.ScrollTo
* jQuery.mousewheel

# Tests

It is being tested on Firefox, Internet Explorer, Opera & Safari on Windows and Mac OS.

