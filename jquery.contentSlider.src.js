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
 * @changelog	1.2	-	added 'autoscroll_direction' option. Values are 'right' and 'left'. Optional. Default is 'right'.
 * 					-	added 'debug' option. Set to 'true' to enable console.log statements for testing functionality.
 * 					-	added short-circuit to stop multiple scrolls at once.
 * @changelog	1.1 -	added 'navigation_inline' option. Set to 'true' to make prev/next navigation buttons appear inline with slider widget
 * 
 * @example		See example.html
 * @class		ContentSlider
 * @name		ContentSlider
 * @version		1.2
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
     * @updated		1.2
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
		 * @updated		1.2
		 */
		var default_options = {
			image_base : null,						// Location of directory where images are located. Default null. Required.
			slide_speed : 500,						// The speed (in milliseconds) in which the slides change when navigation is clicked. Default 500 (0.5s)
			auto_scroll : true,						// Flag indicating whether the widget should auto-scroll. Default true.
			auto_scroll_timeout : 6000,				// Time (in milliseconds) that each slide will be shown before auto-scrolling. Default 6000 (6s).
			pause_on_hover : true,					// Flag indicating whether a hover event on the slider container or its children will pause auto-scroll. Default true.
			stop_on_click : true,					// Flag indicating whether a click event on the slider navigation will stop auto-scroll. Default true.
			slider_height : 300,					// Total height of the entire ContentSlider widget, in pixels. Default 300.
			navigation_inline : false,				// Is navigation inline (true) or on its own line below the slides (false). Default false.
			autoscroll_direction : 'right',			// Determines which direction the widget will auto-scroll. Options: 'left', 'right'. Default 'right'. Optional.
			debug : false							// Flag indicating whether this should output console.log debug statements. Default false. Optional.
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
		var slider_widget_container = this;
		
		/**
		 * The div element which holds the slider overflow area.
		 *
		 * @access		public
		 * @type		HTMLElement
		 * @memberOf	ContentSlider
		 * @since		1.2
		 * @default		slider_widget_container.find('div.sliders');
		 */
		var sliders_container = slider_widget_container.find('div.sliders');
		
		/**
		 * The div overflow element which holds the individual slides
		 *
		 * @access		public
		 * @type		HTMLElement
		 * @memberOf	ContentSlider
		 * @since		1.2
		 * @default		slider_widget_container.find('div.slider_overflow');
		 */
		var overflow_contaner = slider_widget_container.find('div.slider_overflow');
		
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
		
		/**
		 * Flag indicating whether or not the slider is currently animating a slide.
		 *
		 * @access		public
		 * @type		boolean
		 * @memberOf	ContentSlider
		 * @since		1.2
		 * @default		false
		 */
		var currently_animating = false;
		
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
		 * @updated		1.2
		 */
		this.initSlider = function() {
			var slides = slider_widget_container.find('div.slider');
			
			if (options.image_base == null) {
				alert('No image base specified for ContentSlider widget.');
				return;
			}
			
			slider_widget_container.addClass('content_slider_widget');
			
			// add the indicators that show which slide we're on
			var slide_indicator_div = $("<div class='current_slide_indicator'></div>");
			var full_sliders_width = 0;
			if (slides.length > 0) {
				var cur_slide_width = 0;
				slides.each(function(index, slide) {
					if (index == 0) { $(slide).attr('data-first-slide', true); }
					else if (index == slides.length - 1) { $(slide).attr('data-last-slide', true); }
					cur_slide_width = $(slide).width();
					full_sliders_width += cur_slide_width;
					if (options.navigation_inline == false) {
						slide_indicator_div.append($("<img src='"+options.image_base+"/slider-inactive-slide.png' class='slide_indicator' width='10' height='10' />"));
					}
				});
			}
			
			// Add the navigation buttons
			var left_slider_navigation = $("<img src='"+options.image_base+"/slider-left-arrow-static.png' class='slider_left' data-navigation-direction='left' width='20' height='20' />");
			var right_slider_navigaton = $("<img src='"+options.image_base+"/slider-right-arrow-static.png' class='slider_right enabled' data-navigation-direction='right' width='20' height='20' />");
			if (options.navigation_inline == false) {
				slide_indicator_div.prepend(left_slider_navigation);
				slide_indicator_div.append(right_slider_navigaton);
				slider_widget_container.append(slide_indicator_div);
				$(slider_widget_container.find('img.slide_indicator').get(0)).attr('src', options.image_base+'/slider-active-slide.png');
			}
			else {
				left_slider_navigation.addClass('inline');
				right_slider_navigaton.addClass('inline');
				sliders_container.before(left_slider_navigation);
				sliders_container.after(right_slider_navigaton);
			}
			
			// Add event handlers
			slider_widget_container.on('startAutoScroll', slider_widget_container.startAutoScroll);
			slider_widget_container.on('pauseAutoScroll', slider_widget_container.pauseAutoScroll);
			slider_widget_container.on('stopAutoScroll', slider_widget_container.stopAutoScroll);
			sliders_container.on('mouseenter', function() { slider_widget_container.trigger('pauseAutoScroll'); });
			sliders_container.on('mouseleave', function() { slider_widget_container.trigger('startAutoScroll'); });
			slider_widget_container.find('img.slide_indicator').on('click', slider_widget_container.slideIndicatorClickHandler);
			slider_widget_container.addLeftArrowHandlers();
			slider_widget_container.addRightArrowHandlers();
			
			// set final width and height for overflow and sliders containers
			current_slider = $(slides.get(0));
			slider_widget_container.find('img.slider_left').attr('src', options.image_base+'/slider-left-arrow-grey.png'); // hide the left navigation by default
			overflow_contaner.css({width: full_sliders_width+'px'});
			sliders_container.css({width: current_slider.width()+'px', height:options.slider_height+'px'});
			
			// Start auto-scroll - wait half a second, then do it
			setTimeout(function() { slider_widget_container.trigger('startAutoScroll'); }, 500);
		}
		
		/**
		 * Handles when the user clicks a radio button slide indicator. Will slide
		 * the slider widget left or right depending on if the user clicks a
		 * radio button lower or higher than the currently selected one.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 * @updated		1.2
		 *
		 * @param		click_event			Event		Click event triggered when the user clicks on a slide indicator image
		 */
		this.slideIndicatorClickHandler = function(click_event) {
			var clicked_slide_indicator = $(click_event.target);
			if (! currently_animating) {
				currently_animating = true;
				
				// Stop the auto-scroll!
				slider_widget_container.trigger('stopAutoScroll');
				
				var slides = slider_widget_container.find('div.slider');
				var cur_slide_index = current_slider.index() + 1;
				var indicator_id = clicked_slide_indicator.index();
				
				current_slider = slider_widget_container.find('div.slider:nth-child('+indicator_id+')');
				var new_slide_position = current_slider.width() * (indicator_id-1);
				sliders_container.animate({scrollLeft:new_slide_position, duration:options.slide_speed}, {
					complete : function() {
						sliders_container.css({width: current_slider.width()+'px'});
						if (options.navigation_inline == false) {
							var all_indicators = clicked_slide_indicator.siblings('img.slide_indicator');
							all_indicators.attr('src', options.image_base+'/slider-inactive-slide.png');
						}
						clicked_slide_indicator.attr('src', options.image_base+'/slider-active-slide.png');
						slider_widget_container.showOrHideCorrectNavigationImages();
						currently_animating = false;
					}
				});
			}
		}
		
		/**
		 * Handles when the user clicks the Next or Previous slide navigation buttons.
		 * Will slide the slider widget left or right depending on which one the user
		 * clicks.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 * @updated		1.2
		 *
		 * @param		click_event			Event		Click event triggered when the user clicks on the previous or next button
		 * @param		auto_scroll_event	Boolean		Flag indicating whether this is being triggered by an auto-scroll event or a click. Default null.
		 */
		this.slideNavigationClickHandler = function(click_event, auto_scroll_event) {
			var clicked_slide_navigator = $(click_event.target);
			if (! currently_animating &&
				(clicked_slide_navigator.hasClass('enabled') ||
				 auto_scroll_event != null)) {
				currently_animating = true;
				if (options.debug && console !== undefined) { console.log('scrolling!'); }
				if (auto_scroll_event == null) {
					// Stop the auto-scroll!
					slider_widget_container.trigger('stopAutoScroll');
				}
				
				var original_slides = slider_widget_container.find('div.slider');
				var zero_based_cur_slide_index = current_slider.index();
				var one_based_cur_slide_index = zero_based_cur_slide_index + 1;
				var zero_based_new_index = null;
				var one_based_new_index = null;
				
				var new_slide_position = 0;
				
				var cloned_slides = null;
				
				if (clicked_slide_navigator.attr('data-navigation-direction') == 'right') {
					one_based_new_index = one_based_cur_slide_index + 1;
					if (one_based_cur_slide_index == original_slides.length) {
						cloned_slides = original_slides.clone(true, true); // clone the elements
						overflow_contaner.css({width:(overflow_contaner.width() * 2)+'px'}); // resize the overflow parent
						overflow_contaner.append(cloned_slides); // append the cloned slides
					}
				}
				else if (clicked_slide_navigator.attr('data-navigation-direction') == 'left') {
					one_based_new_index = one_based_cur_slide_index - 1;
					if (one_based_cur_slide_index == 1) {
						one_based_new_index += original_slides.length; // now we have the proper index
						cloned_slides = original_slides.clone(true, true); // clone the elements
						overflow_contaner.css({width:(overflow_contaner.width() * 2)+'px'}); // resize the overflow parent
						overflow_contaner.prepend(cloned_slides); // prepend the cloned slides
						// set scroll left to the new left position of the original slide that is about to be slid offscreen
						sliders_container.scrollLeft(current_slider.width() * (zero_based_cur_slide_index+original_slides.length));
					}
				}
				
				zero_based_new_index = one_based_new_index - 1;
				var new_one_based_modulated_slide_index = (one_based_new_index % original_slides.length);
				var new_zero_based_modulated_slide_index = new_one_based_modulated_slide_index - 1;
				
				if (options.debug && console !== undefined) { console.log('\tnew zero-based index: ' + zero_based_new_index +
																		  '\n\tnew one-based index: ' + one_based_new_index +
																		  '\n\tnew zero-based mod index: ' + new_zero_based_modulated_slide_index +
																		  '\n\tnew one-based mod index: ' + new_one_based_modulated_slide_index); }
				
				current_slider = slider_widget_container.find('div.slider:nth-child('+one_based_new_index+')');
				var slider_content_width = current_slider.width();
				new_slide_position = current_slider.width() * zero_based_new_index;
				
				// Actually begin the animation
				sliders_container.animate({scrollLeft:new_slide_position, duration:options.slide_speed}, {
					complete : function() {
						if (cloned_slides != null) {
							// If we were sliding back to the 'first' slide from the 'last' (or vice versa)
							// we have to remove the original slides and set the new final scroll position
							// based on the remaining 'cloned' slides.
							original_slides.remove();
							
							// If we are going 'left' we are already at the correct final scroll position...
							if (clicked_slide_navigator.attr('data-navigation-direction') == 'right') {
								// ...otherwise we have to set the new position to 0
								var remaining_slides = slider_widget_container.find('div.slider');
								overflow_contaner.css({width:(overflow_contaner.width() / 2)+'px'});
								var final_scroll_position = 0;
								$(this).scrollLeft(final_scroll_position);
							}
						}
						sliders_container.css({width: slider_content_width+'px'});
						if (options.navigation_inline == false) {
							slider_widget_container.find('div.current_slide_indicator img.slide_indicator').attr('src', options.image_base+'/slider-inactive-slide.png');
							var slide_indicator_to_activate = $(slider_widget_container.find('div.current_slide_indicator img.slide_indicator').get(new_zero_based_modulated_slide_index));
							slide_indicator_to_activate.attr('src', options.image_base+'/slider-active-slide.png');
						}
						slider_widget_container.showOrHideCorrectNavigationImages();
						currently_animating = false;
					}
				});
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
		 * @updated		1.2
		 */
		this.showOrHideCorrectNavigationImages = function() {
			var all_slides = slider_widget_container.find('div.slider');
			if (current_slider.attr('data-first-slide') !== undefined) {
				slider_widget_container.find('img.slider_left').removeClass('enabled').attr('src', options.image_base+'/slider-left-arrow-grey.png');
				slider_widget_container.find('img.slider_right').addClass('enabled').attr('src', options.image_base+'/slider-right-arrow-static.png');
			}
			else if (current_slider.attr('data-last-slide') !== undefined) {
				slider_widget_container.find('img.slider_left').addClass('enabled').attr('src', options.image_base+'/slider-left-arrow-static.png');
				slider_widget_container.find('img.slider_right').removeClass('enabled').attr('src', options.image_base+'/slider-right-arrow-grey.png');
			}
			else {
				slider_widget_container.find('img.slider_left').addClass('enabled').attr('src', options.image_base+'/slider-left-arrow-static.png');
				slider_widget_container.find('img.slider_right').addClass('enabled').attr('src', options.image_base+'/slider-right-arrow-static.png');
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
		 * @updated		1.2
		 *
		 * @param		autoscroll_event			Event			Custom 'startAutoScroll' event
		 */
		this.startAutoScroll = function(autoscroll_event) {
			// Start auto-scroll if that option indicates to do so
			if (options.auto_scroll == true) {
				if (options.autoscroll_direction == 'right') {
					auto_scroll_interval = setInterval(function() { slider_widget_container.find('img.slider_right').trigger('click', [true]); }, options.auto_scroll_timeout);
				}
				else if (options.autoscroll_direction == 'left') {
					auto_scroll_interval = setInterval(function() { slider_widget_container.find('img.slider_left').trigger('click', [true]); }, options.auto_scroll_timeout);
				}
				if (options.debug && console !== undefined) { console.log('starting slider auto scroll'); }
			}
		}
		
		/**
		 * Checks to see if the auto_scroll option is true, and clears the
		 * auto scroll interval timer. Paused scrolling may be restarted.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 * @updated		1.2
		 *
		 * @param		autoscroll_event			Event			Custom 'pauseAutoScroll' event
		 */
		this.pauseAutoScroll = function(autoscroll_event) {
			if (options.auto_scroll == true && auto_scroll_interval != null) {
				auto_scroll_interval = clearInterval(auto_scroll_interval);
				if (options.debug && console !== undefined) { console.log('pausing slider auto scroll'); }
			}
		}
		
		/**
		 * Checks to see if the auto_scroll option is true. If so, clears the
		 * auto scroll interval timer and sets the auto_scroll option to false
		 * so it does not start up again.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 * @updated		1.2
		 *
		 * @param		autoscroll_event			Event			Custom 'stopAutoScroll' event
		 */
		this.stopAutoScroll = function(autoscroll_event) {
			if (options.auto_scroll == true && auto_scroll_interval != null) {
				auto_scroll_interval = clearInterval(auto_scroll_interval);
				options.auto_scroll = false;
				if (options.debug && console !== undefined) { console.log('stopping slider auto scroll'); }
			}
		}
		
		/********* Navigation event handlers *********/
		
		/**
		 * Adds mouseover, mouseout, and click event handlers for the left (previous) navigation button.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 * @updated		1.2
		 */
		this.addLeftArrowHandlers = function() {
			//, {user_action: true}
			slider_widget_container.find('img.slider_left').on('click', slider_widget_container.slideNavigationClickHandler);
			slider_widget_container.find('img.slider_left').on('mouseover', function() { if ($(this).hasClass('enabled')) {$(this).attr('src', options.image_base+'/slider-left-arrow-rollover.png'); }});
			slider_widget_container.find('img.slider_left').on('mouseout', function() { if ($(this).hasClass('enabled')) {$(this).attr('src', options.image_base+'/slider-left-arrow-static.png'); }});
		}
		
		/**
		 * Adds mouseover, mouseout, and click event handlers for the right (next) navigation button.
		 *
		 * @access		public
		 * @memberOf	ContentSlider
		 * @since		1.0
		 * @updated		1.2
		 */
		this.addRightArrowHandlers = function() {
			slider_widget_container.find('img.slider_right').on('click', slider_widget_container.slideNavigationClickHandler);
			slider_widget_container.find('img.slider_right').on('mouseover', function() { if ($(this).hasClass('enabled')) {$(this).attr('src', options.image_base+'/slider-right-arrow-rollover.png'); }});
			slider_widget_container.find('img.slider_right').on('mouseout', function() { if ($(this).hasClass('enabled')) {$(this).attr('src', options.image_base+'/slider-right-arrow-static.png'); }});
		}
		
		/********* Initialize the slider *********/
		this.initSlider();
		
		/********* Return the newly extended element for chaining *********/
		return this;
	}
})(jQuery);