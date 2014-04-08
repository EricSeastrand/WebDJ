window.WebDJ.GUI = (function(){
	var self = {
		Decks: []
	};
	
	self.initDom = function(){
		self.container = $('#INTERFACE_CONTAINER');
		self.decksContainer	= $('<div>').attr({id: 'Decks_Container'}).appendTo(self.container);
		self.mixerContainer = $('<div>').attr({id: 'Mixer_Container'}).appendTo(self.container);
	};
	$(self.initDom);
	
	function updateValueReadout(){
		var $this = $(this);
		var data = $this.data();
		var text = $this.attr('value');
		try{ text = data.options.formatter(text);} catch(e){};
		try{  text += data.options.unit || '';} catch(e){};
		data.readoutContainer.text( text );
		
	}
	
	self.viewTemplates = {
		bpmFlasher: function(options){
			var bpm = 128;
			var options = options || {};
			var interval = false;
			var oldWidth;
			var container = $('<div>')
				.addClass('metronome-flasher')
				.css({position: 'relative'})
			;
			
			var progressBar = $('<div>')
				.css({
					//'background': 'red',
					'position': 'absolute'
					//'height': '20px'
				})
				.addClass('metronome-bar-progressbar')
				.appendTo(container)
			;
						
			var bpmReadout = $('<span>')
				.text('BPM')
				.addClass('metronome-bpm-readout')
				.css({'z-index': 5, position: 'relative', 'margin-right': '12px'})
				.appendTo(container)
			;
			
			var beatReadout = $('<span>')
				.html('&#x2669')
				.addClass('metronome-beat-readout')
				.css({'z-index': 5, position: 'relative'})
				.appendTo(container)
			;
			
			function setOn(){
				container.css('background', 'red');
			}
			
			function setOff(){
				container.css('background', 'white');
			}
			
			function zero(){
				beatReadout.text(0);
				bpmReadout.text([options.trackBPM || '??',' BPM'].join('') );
				progressBar.css('width', '1%');
			}
			
			var startTime = new Date().getTime();
			function startFlashing(bpm, callbackToGetElapsedTime){
				stopFlashing();
				container.data('isPlaying', true)
				bpm = bpm;
				var msecPerBeat		= 60000 / bpm;
				bpmReadout.text([bpm,' BPM'].join(''));
				if(typeof callbackToGetElapsedTime == 'function')
					var getElapsedWith = callbackToGetElapsedTime;
				
				var elapsedMsec		= getElapsedWith? getElapsedWith() : (new Date().getTime()) - startTime;
				var msecFromNextBeat = (elapsedMsec % msecPerBeat);
				
				interval = window.setInterval(function(){
					var elapsedMsec		= getElapsedWith? getElapsedWith() : (new Date().getTime()) - startTime;
					var msecFromNextBeat = (elapsedMsec % msecPerBeat);
					
					var newWidth = 0;
					var measureProgress = ((elapsedMsec / (msecPerBeat*4)) % 1) * 100;
					
					if(measureProgress < 25){
						beatReadout.text(1);
						newWidth = 25;
					}else if(measureProgress < 50){
						beatReadout.text(2);
						newWidth = 50;
					}else if(measureProgress < 75){
						beatReadout.text(3);
						newWidth = 75;
					}else{
						beatReadout.text(4);
						newWidth = 100;
					}
					if(oldWidth != newWidth)
						progressBar.css('width', newWidth.toString()+'%');
	
					oldWidth = newWidth;
	
				}, 50);
			}
			
			function stopFlashing(){
				container.data('isPlaying', false)
				window.clearInterval(interval);
			}
			
			container.data({zero: zero, startFlashing: startFlashing, stopFlashing: stopFlashing});
			
			if(options.on && options.on.call)options.on('bufferLoaded', zero);
				

			return container;	
		}
	};
	
	self.controlTemplates = {
		beatCounter: function(options){
			var options = options || {};

			var progressBar = $('<div>')
				.addClass('metronome-bar-progressbar')
			;
						
			var bpmReadout = $('<span>')
				.text('BPM')
				.addClass('metronome-bpm-readout')
			;
			
			var beatReadout = $('<span>')
				.html('&#x2669')
				.addClass('metronome-beat-readout')
			;

			var container = $('<div>')
				.addClass('metronome-flasher')
				.append(progressBar, bpmReadout, beatReadout);
			;
			
			function zero(){
				bpmReadout.text(options.deckBackend.trackBPM);
				updateBeat(options.deckBackend.barBeatPosition);
			}

			var currentBeatClassName = 'beat-1';
			function updateBeat(newBeats){
				beatReadout.text(newBeats.beats);
				
				container.removeClass(currentBeatClassName);
				
				currentBeatClassName = ['beat-'+newBeats.beats].join();
				
				container.addClass(currentBeatClassName);
			}
			
			options.deckBackend.on('beatChange', updateBeat);
			options.deckBackend.on('bufferLoaded', zero);	

			return container;
		},

		button: function(options){
			options = options || {};
			if(!options.bindTo) options.bindTo = {};
			
			var container = $('<div>')
				.addClass('button-control-container')
				.css({display: 'inline-block'})
			;
			
			var label = $('<div>')
				.addClass('button-control-param-label')
			;
			if( options.labelHTML )
				label.html(options.labelHTML);
			else
				label.text( options.label || 'No Label' )
			
			var inputElement = $('<button>')
				.append( label )
				.appendTo( container )
				
			//	.css({'color': 'green', 'background': 'pink', padding: '6px 12px', border: '1px solid gray'} )
				.data( {options: options} )
				.trigger('change')
				.attr('title', (options.tooltip || ''))
			;
				
			if( typeof options.onClick == 'function' )
				inputElement.bind('click', function(e){
					options.onClick.call(this, true, e);
				});
			
			if( typeof options.onDblClick == 'function' )
				inputElement.bind('dblclick', function(e){
					options.onDblClick.call(this, true, e);
				});
			
			if(options.classNames) inputElement.addClass(options.classNames);

			return container;		
		},
		slider: function(options){
			options = options || {};
			if(!options.bindTo) options.bindTo = {};
			var sliderIsBeingAdjusted = false;
			
			var sliderContainer = $('<div>')
				.addClass('slider-control-container')
			;
			
			var sliderParamLabel = $('<div>')
				.addClass('slider-control-param-label')
				.text(options.label || 'No Label')
				.appendTo(sliderContainer)
			;
			
			var sliderValueReadout = $('<div>')
				.addClass('slider-control-value-readout')
				.appendTo(sliderContainer)
			;
			
			var sliderInputElement = $('<input>')
				.attr({
					type	: 'range',
					max		: options.bindTo.maxValue	||	options.maxValue	||	100,
					min		: options.bindTo.minValue	||	options.minValue	||	0,
					value	: options.bindTo.value		||	options.value		||	undefined
				})
				.css({width: '100%'})
				.appendTo(sliderContainer)
				.data({readoutContainer:  sliderValueReadout, options: options})
				.bind('change.noPropagation', updateValueReadout)
				.bind({
					'mousedown' : function(){ sliderIsBeingAdjusted = true; },
					'mouseup'	: function(){ sliderIsBeingAdjusted = false; } 
				})
				.trigger('change')
			;
			
			if(options.bindTo)
				sliderInputElement.bind('change', function(){
					options.bindTo.value = this.value;
				});
				
			if(typeof options.onChange == 'function')
				sliderInputElement.bind('change', function(e){
					options.onChange(this.value, e);
				});
				
			if( ( typeof options.bindTo.callback=='function' ) && options.bindTo.object ){
				// binds to a specified @callback for @object('s) @event 
				// then, updates bar percentage to @callback('s) return value
					options.bindTo.object.on(options.bindTo.event, function(){
						if(sliderIsBeingAdjusted) return;
						var newVal = options.bindTo.callback.apply(this, [self].concat(Array.prototype.slice.call(arguments)));
						sliderInputElement.val(newVal);
						updateValueReadout.call(sliderInputElement);
					});
			}
			
			sliderContainer.data('input-element', sliderInputElement);
			
			return sliderContainer;			
		},
		rotary: function(options){
			options = options || {};
			if(!options.bindTo) options.bindTo = {};
			var currentRotation		= 0
			  , rotationStart		= options.imageRotationOffset || -45
			  , rotationEnd			= rotationStart + 270
			  , currentPercentage	= 0
			;
			
			if(!options.maxValue) options.maxValue = options.bindTo.maxValue || 1024;
			if(!options.minValue) options.minValue = options.bindTo.minValue || 0;
			
			var setRotation = function(percent){
				var rotationRange = Math.abs(rotationStart - rotationEnd);
				
				currentRotation = rotationRange * (percent / 100) + rotationStart;
				
				rotaryInputElement.css('-webkit-transform', 'rotate('+currentRotation+'deg)');
			};			
			
			var rotaryContainer = $('<div>')
				.addClass('rotary-control-container')
				.css({display: 'inline-block', margin: 'auto 12px'})
			;
			
			var rotaryParamLabel = $('<div>')
				.addClass('rotary-control-param-label')
				.text(options.label || 'No Label')
				.appendTo(rotaryContainer)
			;
			
			var rotaryValueReadout = $('<div>')
				.addClass('rotary-control-value-readout')
				.appendTo(rotaryContainer)
			;
			
			function setValue(percentage){
				if(percentage < 0) percentage = 0;
				else if(percentage > 100) percentage = 100;
				setRotation(percentage);
				
				currentPercentage = percentage;
				
				rotaryInputElement[0].value = Math.ceil( Math.scaleLog(currentPercentage, options.minValue, options.maxValue) );
				//rotaryInputElement[0].value = Math.log(percentage)/100 * (options.maxValue - options.minValue) + options.minValue;
				
				
				rotaryInputElement.trigger('change');
			}
			
			var rotaryInputElement = $(options.imgSrc?'<img>':'<div>').
				attr({
					src	: options.imgSrc || "img/knob_black.png"
				})
				.addClass('rotary-knob-ui-control')
				.appendTo(rotaryContainer)
				.data({readoutContainer:  rotaryValueReadout, options: options})
				.bind('change', updateValueReadout)
			;
			
			rotaryInputElement.bind('mousedown', function(e){
				e.preventDefault();
				var valueScale = 1;
				if(e.altKey)
					valueScale = .1;
				var startY = e.pageY;
				var oldRotation = currentPercentage;
				console.log(currentRotation);
				$(document)
				.bind('mousemove.rotaryAdjust', function(e){
					setValue(oldRotation + (startY - e.pageY) * valueScale );
				})
				.one('mouseup.rotaryAdjust', function(e){
					$(document).unbind('.rotaryAdjust');
				});
			});
			
			if(options.bindTo)
				rotaryInputElement.bind('change', function(){					
					options.bindTo.value = this.value;
				});



			window.setTimeout(function(){ setValue(options.startPct || 0); }, 3000);
			return rotaryContainer;
		},
		genericReadout: function(options){
			if(!options) options = {};
			var interval = false;
			
			var container = $('<div>')
				.addClass('generic-text-readout '+options.classNames)
			;
			
			var renderContainer = function(options){
				var itemContainer	= $('<div>').appendTo(container);
				itemContainer.addClass(options.classNames);
				itemContainer.attr('title', (options.tooltip || ''));

				var label			= $('<span>').appendTo(itemContainer).text(options.label || '');
				var valueReadout	= $('<span>').appendTo(itemContainer);
				
				if(options.bindTo){
					if(typeof options.bindTo.callback == 'function')
						options.bindTo.object.on(options.bindTo.event, function(e){
							var callbackReturned = options.bindTo.callback(e, valueReadout);
							if( callbackReturned ) valueReadout.text(callbackReturned);
						});
					if(options.bindTo.readFrom)
						options.bindTo.object.on(options.bindTo.event, function(){
							valueReadout.text(options.bindTo.readFrom);
						});
				}

				valueReadout.text(options.defaultValue || '');
			}
			if(options.items && options.items.length){
				for(var i=0; i<options.items.length; i++){
					renderContainer(options.items[i]);
				}
			}
			
			
			return container;	
		},
		progressBar: function(options, my){
			my = my || {};

			var container = $('<div>')
				.addClass('progressBar-container')
				.css({
					position: 'relative'					
				})
			;
			
			var progressBar = $('<div>')
				.addClass('progressBar-bar')
				.css({
					
					'position': 'absolute',				})
				.appendTo(container)
			;
			
			my.setPercentage = function(percent){
				progressBar.width(percent+'%');
			};
			
			if(options.bindTo){
				if(options.bindTo.readFrom && options.bindTo.interval){
				// using window.setInterval(), this reads the object reference passed in through @options.bindTo.readFrom
				// and updates the progressbar's percentage value with the value of readFrom, until @options.bindTo.untilFalse is false
					self.windowInterval = window.setInterval(function(){		
						if(options.bindTo.untilFalse === false) window.clearInterval(self.windowInterval);
						my.setPercentage(options.bindTo.readFrom);  
					}, options.bindTo.interval)
				}
				if( ( typeof options.bindTo.callback=='function' ) && options.bindTo.object ){
				// binds to a specified @callback for @object('s) @event 
				// then, updates bar percentage to @callback('s) return value
					options.bindTo.object.on(options.bindTo.event, function(){
						var newPercent = options.bindTo.callback.apply(this, [self].concat(Array.prototype.slice.call(arguments)));
						my.setPercentage(newPercent);
					});
				}
			
			}
			var readoutObj = {};
			var readouts = self.controlTemplates.genericReadout({items: options.readouts}, readoutObj);
			
			if(readouts.length){
				container.append(readouts, readoutObj);
			}
			return container;
		},
		cuePoints: function(options, my){
			my = my || {};
			var trackLength = 0;

			var container = $('<div>')
				.addClass('cuePoints-container')
				.css({
					position: 'relative'
				})
			;
			
			container.on('click', '.cuePoint', function(){
				var location = $(this).data('cuePointInfo').location;
				console.log(location.bars, location.beats);
				//options.eventTriggerer.scheduleAtBarBeat(location.bars, location.beats);
				options.eventTriggerer.jumpToBarBeatPosition(location.bars, location.beats);
			});
			
			function renderCuePoint(info){
				var cuePointContainer = $('<div>')
					.addClass('cuePoint')
					.css({
						width		: '6px',
						height		: '100%',
						background	: 'black',
						position	: 'absolute',
						left		: (options.eventTriggerer.barsBeatsToSeconds(info.location.bars, info.location.beats)  / trackLength)*100+'%'
					})
					.data('cuePointInfo', info)
					.appendTo(container)
				;
				$('<div>')
					.addClass('cuePointLabel')
					.text(info.title)
					.css({
						'padding-left': '6px',
						'font-size': '10px'
					})
					.appendTo(cuePointContainer)
					
			}
			
			function renderCuePoints(){
				container.empty();
				trackLength = options.eventTriggerer.source.buffer.duration - options.eventTriggerer.trackStartOffset;
				var cuePoints = options.eventTriggerer[options.getCuePointsFrom];
				for(var i=0; i<cuePoints.length; i++){
					renderCuePoint(cuePoints[i]);
				}
			}
			
			options.eventTriggerer.on(options.refreshOnEvent, renderCuePoints);
			
			/*
			
			
			if(options.bindTo){
				if(options.bindTo.readFrom && options.bindTo.interval){
				// using window.setInterval(), this reads the object reference passed in through @options.bindTo.readFrom
				// and updates the progressbar's percentage value with the value of readFrom, until @options.bindTo.untilFalse is false
					self.windowInterval = window.setInterval(function(){		
						if(options.bindTo.untilFalse === false) window.clearInterval(self.windowInterval);
						my.setPercentage(options.bindTo.readFrom);  
					}, options.bindTo.interval)
				}
				if( ( typeof options.bindTo.callback=='function' ) && options.bindTo.object ){
				// binds to a specified @callback for @object('s) @event 
				// then, updates bar percentage to @callback('s) return value
					options.bindTo.object.on(options.bindTo.event, function(){
						var newPercent = options.bindTo.callback.apply(this, [self].concat(Array.prototype.slice.call(arguments)));
						my.setPercentage(newPercent);
					});
				}
		
			}	*/
			
			//var readoutObj = {};
			//var readouts = self.controlTemplates.genericReadout({items: options.readouts}, readoutObj);
			//console.log(options.readouts);
			//container.append(readouts, readoutObj);
			
			return container;
		}
	};

	function RenderChannelStrip(mixerBackend, channel){
		var container = $('<div>').addClass('mixer-channel-strip').css({display: 'inline-block', width: '30%', border: '1px solid blue'});
		self.Mixer.renderedControls[channel] = {_container: container};
		function hertzToKHz(Hz) {
			Hz  = parseFloat(Hz);

			if(Hz < 8000) return Hz.toString();

			
			var text = Math.floor(Hz / 1000);

			return [text, 'K'].join('');
		}
		var controls = {
			hpf_filter_cutoff: {
				type: 'rotary',
				options: {
					label	: 'High Pass Cutoff',
					//imgSrc	: 'img/knob_black.png',
					//imageRotationOffset: -45, // degrees
					unit	: 'Hz',
					formatter: hertzToKHz,
					startPct: 0,
					bindTo	: mixerBackend.channels[channel].components[1].frequency
				}
			},
			lpf_filter_cutoff: {
				type: 'rotary',
				options: {
					label	: 'Low Pass Cutoff',
					//imgSrc	: 'img/knob_black.png',
					//imageRotationOffset: -45, // degrees
					unit	: 'Hz',
					formatter: hertzToKHz,
					startPct: 100,
					bindTo	: mixerBackend.channels[channel].components[0].frequency
				}
			},

			/*eq_gain: {
				type: 'slider',
				options: {
					label	: 'Low Shelf Gain',
					unit	: 'hz',						
					bindTo	: mixerBackend.channels[channel].components[1].params.gain
				}
			},
			eq_freq: {
				type: 'slider',
				options: {
					label: 'Low Shelf Freq',
					bindTo: mixerBackend.channels[channel].components[1].filterComponent.frequency
				}
			}*/
		};
		var thisDecksControls = {};
		for(var controlName in controls){
			var thisControl = controls[controlName];
			
			var renderedControl = self.controlTemplates[thisControl.type](thisControl.options);
			
			thisDecksControls[controlName] = renderedControl;
			
			container.append( renderedControl );
		}
		self.Mixer.renderedControls[channel].controls = thisDecksControls;
		return container;
	}
	
	self.RenderMixer = function(mixerBackend){
		self.Mixer = {
			renderedControls: []
		};
		
		for(var i=0; i<mixerBackend.channels.length; i++){
			RenderChannelStrip(mixerBackend, i)
				.appendTo(self.mixerContainer);
		}
	}
	
	self.RenderDeck = function(deckBackend){
		var Deck = {
			renderedControls: {}
		};
		var deckContainer = $('<div>')
			.addClass('deck-container')
			.css({
				padding: '5px',
				border: '1px solid black',
				display: 'inline-block',
				width: '50%'
			})
			.data('deckAPI', deckBackend)
			.appendTo(self.decksContainer)
		;
		deckBackend.GUI = {'class': Deck, 'dom': deckContainer};
					// file drag hover
		function FileDragHover(e) {
			e.stopPropagation();
			e.preventDefault();
			if(e.type == "dragover")
				$(e.target).addClass('hovering');
			else
				$(e.target).removeClass('hovering');
		}

		deckContainer[0].addEventListener("dragover", FileDragHover, false);
		deckContainer[0].addEventListener("dragleave", FileDragHover, false);
		deckContainer[0].addEventListener("drop", function (e) {
			e.preventDefault(); e.stopPropagation();
			
			var file = e.dataTransfer.files[0],
			    reader = new FileReader();
			
			reader.onload = function (event) {
				deckBackend.loadTrackByFileAPI(file.name,reader.result);
				console.log(event, this, reader);
			
			};
			
			reader.readAsArrayBuffer(file);

			return false;
		}, false);


		Deck.controls = {
			bpmFlasher: {
				type: 'beatCounter',
 				options: {
					deckBackend: deckBackend
				}
			},
			barBeatPositionReadout: {
				type: 'genericReadout',
 				options: {
					items: [
						{
							classNames: 'bar-beat-position',
							defaultValue: 'Bar 0',
							bindTo: {
								event: 'beatChange bufferLoaded',
								object: deckBackend,
								callback: function(newPos, textContainer){
									var bars = newPos.bars || '1';  
									textContainer.text('Bar '+bars);
								}
							}
						}
					]
				}
			},
			deckStatusReadout: {
				type: 'genericReadout',
				options: {
					items: [
						{
							defaultValue: 'Now Playing:',
							classNames: 'now-playing',
							bindTo: {
								event: 'bufferLoaded',
								object: deckBackend,
								callback: function(newPos, textContainer){
									var loadedFile = /[^/]*$/.exec(this.object.getNowPlayingFilename())
									var songInfo = WebDJ.SongInfo.getInfoFor( loadedFile[0] );
									
									textContainer.text(songInfo.songName || loadedFile[0])
								}
							}
						},{
							label: '',
							classNames: 'now-loading',
							bindTo: {
								event: 'startedLoading bufferLoaded',
								object: deckBackend,
								callback: function(newPos, textContainer){
									if(this.object.isLoadingTrackURL) {
										var songInfo = WebDJ.SongInfo.getInfoFor( this.object.isLoadingTrackURL.toString() );
									
										textContainer.text('Loading: ' + songInfo.songName || this.object.isLoadingTrackURL);
									} else
										textContainer.text('');
								}
							}
						},{
							defaultValue: 'Time',
							classNames: 'time-readout',
							bindTo: {
								event: 'playheadChange',
								object: deckBackend,
								callback: function(newPos, textContainer){
									textContainer.text([
										WebDJ.UTIL.secondsToHMS_Formatted(this.object.calculatedPlayheadPosition/1000),
											' / ',
										WebDJ.UTIL.secondsToHMS_Formatted( (this.object.source.buffer.duration - this.object.trackStartOffset) * (1/this.object.playbackRate) )
									].join(''));
								}
							}
						}
					]
				}
			},
			playbackRate: {
				type: 'slider',
				options: {
					label: 'Speed Shift',
					minValue: "-1200",
					maxValue: "1200",
					unit: '%',
					formatter: function(v){ return parseInt(v) / 100; },
					onChange: function(newVal, e){
						deckBackend.setSpeed(1 + (newVal / 10000));
						if(e.ctrlKey) deckBackend.trackBPM =  Math.floor( deckBackend.calculatedBPM );

					},bindTo: {
						event: 'playStart bpmSync',
						object: deckBackend,
						callback: function(control, elapsed, total){
							return (this.source.playbackRate.value - 1) * 10000;
						}
					}
					
				}
			},
			startOffset: {
				type: 'slider',
				options: {
					label: 'Offset',
					minValue: "-200",
					maxValue: "200",
					unit: 'ms',
					value	: deckBackend.trackStartOffset,
					onChange: function(newVal, e){
						deckBackend.setOffsetRealTime(newVal/1000, e.shiftKey);
					},
					bindTo: {
						event: 'songInfoLoaded',
						object: deckBackend,
						callback: function(control, elapsed, total){
							return this.trackStartOffset * 1000;
						}
					}
				}
			},
			play: {
				type: 'button',
				classNames: 'deck-play-button',
				options: {
					labelHTML: '&#x25B8;',
					classNames: 'button-green',
					onClick: function(newVal, e){
						deckBackend.play(); // with no params, makes it play the last file it loaded.
					}
				}
			},
			stop: {
				type: 'button',
				options: {
					classNames: 'deck-stop-button button-red',
					labelHTML: '&#x25A0;',
					onClick: function(newVal, e){
						deckBackend.stop(e.shiftKey /*Makes shift+click return the playhead to the start*/);
					},
					onDblClick: function(newVal, e){
						deckBackend.stop(true);
					}
				}
			},
			nudgeBackward: {
				type: 'button',
				options: {
					classNames: 'button-sky',
					labelHTML: '&#x25C2;&#x25C2;',
					tooltip: 'Click to jump backwards 25 milliseconds in the track. Double click to go back 100 ms.',
					onClick: function(newVal, e){
						deckBackend.nudge(-.025);
					},
					onDblClick: function(newVal, e){
						deckBackend.nudge(-.1);
					}
				}
			},
			nudgeForward: {
				type: 'button',
				options: {
					classNames: 'button-sky',
					labelHTML: '&#x25B8;&#x25B8;',
					tooltip: 'Click to jump forward 25 milliseconds in the track. Double click to go forward 100 ms.',
					onClick: function(newVal, e){
						deckBackend.nudge(.025);
					},
					onDblClick: function(newVal, e){
						deckBackend.nudge(.1);
					}
				}
			},
			nudgeBackwardBeats: {
				type: 'button',
				options: {
					classNames: 'button-orange',
					labelHTML: '&#x25C3;&#x25C3;',
					tooltip: 'Click to jump 1 beat back.',
					onClick: function(newVal, e){
						deckBackend.nudgeBeats(-1);
					},
					onDblClick: function(newVal, e){
						deckBackend.nudgeBeats(-4);
					}
				}
			},
			nudgeForwardBeats: {
				type: 'button',
				options: {
					classNames: 'button-orange',
					labelHTML: '&#x25B9;&#x25B9;',
					tooltip: 'Click to jump 1 beat forward.',
					onClick: function(newVal, e){
						deckBackend.nudgeBeats(1);
					},
					onDblClick: function(newVal, e){
						deckBackend.nudgeBeats(4);
					}
				}
			},
			nudgeBackwardBar: {
				type: 'button',
				options: {
					classNames: 'button-yellow',
					labelHTML: '&#x25C5;&#x25C5;',
					tooltip: 'Click to jump 1 bar back.',
					onClick: function(newVal, e){
						deckBackend.nudgeBeats(-4);
					}
				}
			},
			nudgeForwardBar: {
				type: 'button',
				options: {
					classNames: 'button-yellow',
					labelHTML: '&#x25BB;&#x25BB;',
					tooltip: 'Click to jump 1 bar forward.',
					onClick: function(newVal, e){
						deckBackend.nudgeBeats(4);
					}
				}
			},
			cuePoints: {
				type: 'cuePoints',
				options: {
					refreshOnEvent: 'songInfoLoaded',
					eventTriggerer: deckBackend,
					getCuePointsFrom: 'trackCuePoints'
				}
			},
			elapsedTime: {
				type: 'progressBar',
				options: {
					bindTo: {
						event: 'playheadChange',
						object: deckBackend,
						callback: function(control, elapsed, total){
							return elapsed / total * 100;
						}
					},
					readouts: [
						
					]
				}
			}
		}
		///////////////////////////////
		//	
		//	This is where the deck control elements actually get instanciated and appended to the dom.
		//
		for(var controlName in Deck.controls){
			var thisControl = Deck.controls[controlName];			// APIObject has the control's functions in it.
			var APIObject = {};
			var renderedControl = self.controlTemplates[thisControl.type](thisControl.options, APIObject);
			
			Deck.renderedControls[controlName] = renderedControl;
			
			thisControl = APIObject; // This allows access to all of the components through the deck they were rendered for.
			
			deckContainer.append( renderedControl );
		}
		
		deckBackend.on('playStart', function(){ deckContainer.addClass('is-playing'); });
		deckBackend.on('playStop',  function(){ deckContainer.removeClass('is-playing'); });

		deckBackend.on('bufferLoaded', function(){ deckContainer.removeClass('busy'); });


		deckBackend.on('startedLoading', function(){ deckContainer.addClass('busy'); });


		self.Decks.push(Deck);
	};
		
	self.RenderGlobalControls = function(deck1, deck2){
		var Global = {
			renderedControls: {}
		};
		self.renderedGlobalControls = Global.renderedControls;
		
		var controlsContainer = $('<div>')
			.addClass('mixer-global-container')
			.css({
				padding: '5px',
				border: '1px solid black',
				display: 'inline-block',
				width: '40%'
			})
			//.data('deckAPI', deckBackend)
			.appendTo(self.mixerContainer)
		;
		

		
		Global.controls = {
			crossFader: {
				type: 'slider',
				options: {
					label: 'Crossfader',
					minValue: "0",
					maxValue: "1000",
					formatter: function(val){ return (val - 500)/10 + '%';  },
					onChange: function(newVal){
						newVal = newVal / 10;
						
						var deck2New = 100 - Math.scaleLog(100 - newVal, 1, 100);
						var deck1New = 100 - Math.scaleLog(newVal, 1, 100);
						
						//console.log(deck1New, deck2New);

						deck1.setGain( deck1New / 100 );
						deck2.setGain( deck2New / 100 );
					}
				}
			}
		}
		///////////////////////////////
		//	
		//	This is where the deck control elements actually get instanciated and appended to the dom.
		//
		for(var controlName in Global.controls){
			var thisControl = Global.controls[controlName];			// APIObject has the control's functions in it.
			var APIObject = {};
			var renderedControl = self.controlTemplates[thisControl.type](thisControl.options, APIObject);
			
			Global.renderedControls[controlName] = renderedControl;
			
			thisControl = APIObject; // This allows access to all of the components through the deck they were rendered for.
			
			controlsContainer.append( renderedControl );
		}
		
		controlsContainer.insertAfter(WebDJ.GUI.Mixer.renderedControls[0]._container);
		
		//self.Decks.push(Deck);
	};
	
	return self;
}());
