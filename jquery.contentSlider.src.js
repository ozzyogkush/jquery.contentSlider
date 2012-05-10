/**
 * Creates a slider widget which can take an arbitrary number of div elements and turn
 * it into a functional left/right sliding enter/exit system. The slider widget can
 * auto-start with a specified delay.
 *
 * Requires jQuery.js 1.7.0 or higher to function.
 *
 * Usage:
 * 	Top level div element with class 'sliders'. Inside the 'sliders' div is a single div with the
 * 	class 'slider_overflow'. Inside the 'slider_overflow' div there are any number of
 * 	div elements each with the class 'slider'. Each 'slider' div will contain the content that
 * 	will appear in that slide. The Previous and Next buttons are automatically added for
 * 	the user, and the slide indicators are automatically added (one per slide) for the user
 * 	as well.
 *
 * 	CAVEAT: There must not be any whitespace between the ending and start tags of adjacent
 * 	'slider' divs. Browsers rendering such whitespace will mess up computed widths and one
 * 	or more of the sliders would render below the slider section.
 * 		EG: ...</div><div class='slider'>...
 *
 * @changelog	1.1 -	added 'navigation_inline' option. Set to 'true' to make prev/next navigation buttons appear inline with slider widget
 * 
 * @example		See example.html
 * @class		ContentSlider
 * @name		ContentSlider
 * @version		1.1
 * @author		Derek Rosenzweig <derek.rosenzweig@gmail.com, drosenzweig@riccagroup.com>
 */
(function($) {
	
	/**
     * Constructor. Adds the slider prev/next buttons, slide indicator radio buttons (one per slide),
     * and all necessary event handlers for changing slides and showing image hover status.
     *
     * By default, the first slide is selected.
     *
     * @access		public
     * @memberOf	ContentSlider
     * @since		1.0
     * @updated		1.1
     *
     * @param		options				Object				An object containing various options.
     *
     * @returns		this				jQuery				The jQuery element being extended gets returned for chaining purposes
     */
	$.fn.contentSlider = function(options) {
		//--------------------------------------------------------------------------
		//
		//  Variables and get/set functions
		//
		//--------------------------------------------------------------------------
		
		/**
		 * Default options for the widget. Overwrite by including individual
		 * options in the 'options' map object when extending the slider container.
		 *
		 * @access		public
		 * @type		Object
		 * @memberOf	ContentSlider
		 * @since		1.0
		 * @updated		1.1
		 */
		var default_options = {
			image_base : null,						// Location of directory where images are located. Default null. Required.
			slide_speed : 500,						// The speed (in milliseconds) in which the slides change when navigation is clicked. Default 500 (0.5s)
			auto_scroll : true,						// Flag indicating whether the widget should auto-scroll. Default true.
			auto_scroll_timeout : 6000,				// Time (in milliseconds) that each slide will be shown before auto-scrolling. Default 6000 (6s).
			pause_on_hover : true,					// Flag indicating whether a hover event on the slider container or its children will pause auto-scroll. Default true.
			stop_on_click : true,					// Flag indicating whether a click event on the slider navigation will stop auto-scroll. Default true.
			slider_height : 300,					// Total height of the entire ContentSlider widget, in pixels. Default 300.
			navigation_inline : false				// Is navigation inline (true) or on its own line below the slides (false). Default false.
		};
		options = $.extend(default_options, options);
		
		/**
		 * The div element which holds the slider widget and which is extending
		 * using this contentSlider class.
		 *
		 * @access		public
		 * @type		HTMLElement
		 * @memberOf	ContentSlider
		 * @since		1.0
		 * @default		this
		 */
		var slider_container = this;
		
		/**
		 * The current slider div being shown. Used so we can easily grab its index,
		 * width, height, and any other properties needed to properly animate and show
		 * the slide.
		 *
		 * @access		public
		 * @type		HTMLElement
		 * @memberOf	ContentSlider
		 * @since		1.0
		 * @default		null
		 */
		var current_slider = null;
		
		/**
		 * The ID of an interval set by setInterval.
		 *
		 * @access		public
		 * @type		integer
		 * @memberOf	ContentSlider
		 * @since		1.0
		 * @default		null
		 */
		var auto_scroll_interval = null;
		
		//--------------------------------------------------------------------------
		//
		//  Methods
		//
		//--------------------------------------------------------------------------
		
		/**
		 * Initializes the slider widget. Add 'n' slide page indicators (where n = the number
		 * of slides given by the 'div.sliders div.slider_overflow div.slider' selector) plus
		 * the left/right navigation buttons and their click and hover event handlers.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 * @updated		1.1
		 */
		this.initSlider = function() {
			var overflow_contaner = slider_container.find('div.slider_overflow');
			var slides = slider_container.find('div.slider');
			
			if (options.image_base == null) {
				alert('No image base specified for ContentSlider widget.');
				return;
			}
			
			// add the indicators that show which slide we're on
			var slide_indicator_div = $("<div class='current_slide_indicator'></div>");
			var full_sliders_width = 0;
			if (slides.length > 0) {
				var cur_slide_width = 0;
				slides.each(function(index, slide) {
					cur_slide_width = $(slide).width();
					full_sliders_width += cur_slide_width;
					if (options.navigation_inline == false) {
						slide_indicator_div.append($("<img src='"+options.image_base+"/slider-inactive-slide.png' class='slide_indicator' width='10' height='10' />"));
					}
				});
			}
			
			// Add the navigation buttons
			var left_slider_navigation = $("<img src='"+options.image_base+"/slider-left-arrow-static.png' id='slider_left' width='20' height='20' />");
			var right_slider_navigaton = $("<img src='"+options.image_base+"/slider-right-arrow-static.png' id='slider_right' class='enabled' width='20' height='20'  />");
			if (options.navigation_inline == false) {
				slide_indicator_div.prepend(left_slider_navigation);
				slide_indicator_div.append(right_slider_navigaton);
				slider_container.append(slide_indicator_div);
				$(slider_container.find('img.slide_indicator').get(0)).attr('src', options.image_base+'/slider-active-slide.png');
			}
			else {
				left_slider_navigation.addClass('inline');
				right_slider_navigaton.addClass('inline');
				$('div.sliders').before(left_slider_navigation);
				$('div.sliders').after(right_slider_navigaton);
			}
			
			// Add event handlers
			slider_container.on('startAutoScroll', slider_container.startAutoScroll);
			slider_container.on('pauseAutoScroll', slider_container.pauseAutoScroll);
			slider_container.on('stopAutoScroll', slider_container.stopAutoScroll);
			$('div.sliders').on('mouseenter', function() { slider_container.trigger('pauseAutoScroll'); });
			$('div.sliders').on('mouseleave', function() { slider_container.trigger('startAutoScroll'); });
			slider_container.find('img.slide_indicator').on('click', slider_container.slideIndicatorClickHandler);
			slider_container.addLeftArrowHandlers();
			slider_container.addRightArrowHandlers();
			
			// set final width and height for overflow and sliders containers
			current_slider = $(slides.get(0));
			$('#slider_left').attr('src', options.image_base+'/slider-left-arrow-grey.png'); // hide the left navigation by default
			overflow_contaner.css({width: full_sliders_width+'px'});
			$('div.sliders').css({width: current_slider.width()+'px', height:options.slider_height+'px'});
			
			// Start auto-scroll - wait half a second, then do it
			setTimeout(function() { slider_container.trigger('startAutoScroll'); }, 500);
		}
		
		/**
		 * Handles when the user clicks a radio button slide indicator. Will slide
		 * the slider widget left or right depending on if the user clicks a
		 * radio button lower or higher than the currently selected one.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 * @updated		1.1
		 *
		 * @param		click_event			Event		Click event triggered when the user clicks on a slide indicator image
		 */
		this.slideIndicatorClickHandler = function(click_event) {
			var clicked_slide_indicator = $(click_event.target);
			
			var slider_parent = $('div.sliders');
			var overflow_contaner = $('div.slider_overflow');
			var cur_slide_index = current_slider.index() + 1;
			var indicator_id = clicked_slide_indicator.index();
			
			current_slider = $('div.slider:nth-child('+indicator_id+')');
			var new_slide_position = current_slider.width() * (indicator_id-1);
			slider_parent.animate({scrollLeft:new_slide_position, duration:options.slide_speed});
			$('div.sliders').css({width: current_slider.width()+'px'});
			
			if (options.navigation_inline == false) {
				var all_indicators = clicked_slide_indicator.siblings('img.slide_indicator');
				all_indicators.attr('src', options.image_base+'/slider-inactive-slide.png');
			}
			
			clicked_slide_indicator.attr('src', options.image_base+'/slider-active-slide.png');
			
			slider_container.showOrHideCorrectNavigationImages(indicator_id);
			
			// Stop the auto-scroll!
			slider_container.trigger('stopAutoScroll');
		}
		
		/**
		 * Handles when the user clicks the Next or Previous slide navigation buttons.
		 * Will slide the slider widget left or right depending on which one the user
		 * clicks.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 * @updated		1.1
		 *
		 * @param		click_event			Event		Click event triggered when the user clicks on the previous or next button
		 * @param		auto_scroll_event	Boolean		Flag indicating whether this is being triggered by an auto-scroll event or a click. Default null.
		 */
		this.slideNavigationClickHandler = function(click_event, auto_scroll_event) {
			var clicked_slide_navigator = $(click_event.target);
			if (clicked_slide_navigator.hasClass('enabled') ||
				auto_scroll_event != null) {
				var slider_parent = $('div.sliders');
				var overflow_contaner = $('div.slider_overflow');
				var all_sliders = slider_parent.find('div.slider');
				var cur_slide_index = current_slider.index() + 1;
				var new_index = null;
				var new_slide_position = 0;
				
				if (clicked_slide_navigator.attr('id').match(/left/)) {
					if (cur_slide_index == 1) {
						new_index = all_sliders.length;
					}
					else {
						new_index = cur_slide_index - 1;
					}
				}
				else if (clicked_slide_navigator.attr('id').match(/right/)) {
					if (cur_slide_index == all_sliders.length) {
						new_index = 1;
					}
					else {
						new_index = cur_slide_index + 1;
					}
				}
				slider_container.showOrHideCorrectNavigationImages(new_index);
				new_slide_position = current_slider.width() * (new_index-1);
				current_slider = $('div.slider:nth-child('+new_index+')');
				slider_parent.animate({scrollLeft:new_slide_position, duration:options.slide_speed});
				$('div.sliders').css({width: current_slider.width()+'px'});
				
				if (options.navigation_inline == false) {
					$('div.current_slide_indicator img.slide_indicator').attr('src', options.image_base+'/slider-inactive-slide.png');
					$('div.current_slide_indicator img.slide_indicator:nth-child('+(new_index+1)+')').attr('src', options.image_base+'/slider-active-slide.png');
				}
				
				if (auto_scroll_event == null) {
					// Stop the auto-scroll!
					slider_container.trigger('stopAutoScroll');
				}
			}
		}
		
		/**
		 * Hides or shows the previous/next button depending on which slide is being
		 * viewed. If we're viewing the first one, we don't show the previous button;
		 * if we're viewing the last one, we don't show the next button; otherwise,
		 * we show both buttons.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 *
		 * @param		new_index			Integer			Slide index being shown
		 */
		this.showOrHideCorrectNavigationImages = function(new_index) {
			var all_sliders = $('div.sliders').find('div.slider');
			if (new_index == 1) {
				$('#slider_left').removeClass('enabled').attr('src', options.image_base+'/slider-left-arrow-grey.png');
				$('#slider_right').addClass('enabled').attr('src', options.image_base+'/slider-right-arrow-static.png');
			}
			else if (new_index == all_sliders.length) {
				$('#slider_left').addClass('enabled').attr('src', options.image_base+'/slider-left-arrow-static.png');
				$('#slider_right').removeClass('enabled').attr('src', options.image_base+'/slider-right-arrow-grey.png');
			}
			else {
				$('#slider_left').addClass('enabled').attr('src', options.image_base+'/slider-left-arrow-static.png');
				$('#slider_right').addClass('enabled').attr('src', options.image_base+'/slider-right-arrow-static.png');
			}
		}
		
		/********* Auto Scroll event handlers *********/
		
		/**
		 * Checks to see if the auto_scroll option is true, and if so, sets
		 * an interval timer to scroll to the next slide.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 *
		 * @param		autoscroll_event			Event			Custom 'startAutoScroll' event
		 */
		this.startAutoScroll = function(autoscroll_event) {
			// Start auto-scroll if that option indicates to do so
			if (options.auto_scroll == true) {
				auto_scroll_interval = setInterval(function() { $('#slider_right').trigger('click', [true]); }, options.auto_scroll_timeout);
				//if (console !== undefined) { console.log('starting slider auto scroll'); }
			}
		}
		
		/**
		 * Checks to see if the auto_scroll option is true, and clears the
		 * auto scroll interval timer. Paused scrolling may be restarted.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 *
		 * @param		autoscroll_event			Event			Custom 'pauseAutoScroll' event
		 */
		this.pauseAutoScroll = function(autoscroll_event) {
			if (options.auto_scroll == true && auto_scroll_interval != null) {
				auto_scroll_interval = clearInterval(auto_scroll_interval);
			}
			//if (console !== undefined) { console.log('pausing slider auto scroll'); }
		}
		
		/**
		 * Checks to see if the auto_scroll option is true. If so, clears the
		 * auto scroll interval timer and sets the auto_scroll option to false
		 * so it does not start up again.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 *
		 * @param		autoscroll_event			Event			Custom 'stopAutoScroll' event
		 */
		this.stopAutoScroll = function(autoscroll_event) {
			if (options.auto_scroll == true && auto_scroll_interval != null) {
				auto_scroll_interval = clearInterval(auto_scroll_interval);
				options.auto_scroll = false;
				//if (console !== undefined) { console.log('stopping slider auto scroll'); }
			}
		}
		
		/********* Navigation event handlers *********/
		
		/**
		 * Adds mouseover, mouseout, and click event handlers for the left (previous) navigation button.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 */
		this.addLeftArrowHandlers = function() {
			//, {user_action: true}
			$('#slider_left').on('click', slider_container.slideNavigationClickHandler);
			$('#slider_left').on('mouseover', function() { if ($(this).hasClass('enabled')) {$(this).attr('src', options.image_base+'/slider-left-arrow-rollover.png'); }});
			$('#slider_left').on('mouseout', function() { if ($(this).hasClass('enabled')) {$(this).attr('src', options.image_base+'/slider-left-arrow-static.png'); }});
		}
		
		/**
		 * Adds mouseover, mouseout, and click event handlers for the right (next) navigation button.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 */
		this.addRightArrowHandlers = function() {
			$('#slider_right').on('click', slider_container.slideNavigationClickHandler);
			$('#slider_right').on('mouseover', function() { if ($(this).hasClass('enabled')) {$(this).attr('src', options.image_base+'/slider-right-arrow-rollover.png'); }});
			$('#slider_right').on('mouseout', function() { if ($(this).hasClass('enabled')) {$(this).attr('src', options.image_base+'/slider-right-arrow-static.png'); }});
		}
		
		/********* Initialize the slider *********/
		this.initSlider();
		
		/********* Return the newly extended element for chaining *********/
		return this;
	}
})(jQuery);