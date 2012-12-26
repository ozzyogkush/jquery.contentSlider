jQuery Content Slider Plugin
============================

Creates a slider widget which can take an arbitrary number of div elements and turn
it into a functional left/right sliding enter/exit system. The slider widget can
auto-start with a specified delay.

Cross-platform Compatibility
----------------------------

* Firefox 3+
* Webkit (Google Chrome, Apple's Safari)
* Internet Explorer 7+
* Opera

Requirements
------------
* jQuery 1.7.0+

Feature Overview
----------------
* Slide indicators can be below the slide set, or inline with it
* Can be set to auto-slide to the right or to the left
* Pauses auto-slide when the user hovers the current slide
* Halts auto-slide when the user manually selects a slide

Usage
=====
Create a top level `<div>` element with the class 'sliders'. Inside is a single
`<div>` element with the class 'slider_overflow'. Inside the 'slider_overflow'
`<div>` there are any number of `<div>` elements each with the class 'slider'.

Each 'slider' `<div>` will contain the content that will appear in that slide.
The Previous and Next buttons are automatically added for the user, and the
slide indicators are automatically added (one per slide) for the user as well.

NOTE: There must not be any whitespace between the ending and start tags of adjacent
'slider' `<div>`s. Browsers rendering such whitespace will mess up computed widths and one
or more of the sliders would render below the slider section.
	EG: ...`</div><div class='slider'>`...

####Required options:
* image\_base				location of directory where images are located

You can re-initialize the contentSlider by calling .contentSlider() on your jQuery
extended `<div class="content_slider_widget">` element with the method name 'reinit' as the first argument, rather than a set of options.
Example
-------
	<div id="slider_section_left">
		<div class='sliders'>
			<div class='slider_overflow'>
				<div class='slider'>
					Slide 1... Put something here, style it, and be done!
				</div><div class='slider'><!-- Note how there is no whitespace between the end and start tags -->
					Slide 2... Put something here, style it, and be done!
				</div><div class='slider'><!-- Note how there is no whitespace between the end and start tags -->
					Slide 3... Put something here, style it, and be done!
				</div>
			</div>
		</div>
	</div>
	
	<script type='text/javascript'>
		// Initialize global rollovers for the site.
		$('#slider_section_left').contentSlider({image_base : 'images',
												 slide_speed : 1000,
												 slider_height : 150,
												 auto_scroll_timeout : 8000,
												 navigation_inline : false,
												 autoscroll_direction : 'left',
												 debug: true});
		
		setTimeout(function() {
			$('#slider_section_left').contentSlider('reinit');
		}, 10000);
	</script>