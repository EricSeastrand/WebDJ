"use strict";
window.audioUtilities = {components:{}};
window.WebDJ = {cache: {},
	rootFilePath: 'Music/'
};

function updateLoadingInfo(){
	var loadingDiv = $('#loading_div');
	
	if(!loadingDiv[0]) loadingDiv = $('<div>').attr('id', 'loading_div').prependTo('body');
	
	if(WebDJ.Main.deck1.lastFileLoaded && WebDJ.Main.deck2.lastFileLoaded){
	//	loadingDiv.html('Everything is loaded!<br/>To get started, press the "Play In Sync" button to start a mashup auto-magically!</br>Turn the knobs up and down to see what cool combinations you can make with the two tracks. You can also sometimes make cool mashups with the start and stop buttons. Shift+click on the stop button brings the deck all the way back to bar 1.<br/>Hint: To turn a knob up or down, click it and drag straight upwards or downwards.<br/>You can drag and drop these tracks onto either deck to load them.');
	}else{
	//	loadingDiv.text('Sit tight. I\'m loading some mp3s for you to play with.');
	}
	
	
};

window.WebDJ.Main = (function(){
	var self = {};
	
	var context = self.context = new webkitAudioContext();

	self.init = function(){
		self.deck1 = window.audioUtilities.VirtualCDJ(context);
		self.deck2 = window.audioUtilities.VirtualCDJ(context);
		
		self.deck1.syncSource = self.deck2;
		self.deck2.syncSource = self.deck1;
		
		
		self.mixer = window.audioUtilities.VirtualDJM(context, context.destination);
		self.mixer.addChannel(self.deck1);
		self.mixer.addChannel(self.deck2);
		
				
		
		window.WebDJ.GUI.RenderMixer(self.mixer);
		
		window.WebDJ.GUI.RenderDeck(self.deck1);
		window.WebDJ.GUI.RenderDeck(self.deck2);
		window.WebDJ.GUI.RenderGlobalControls(self.deck1, self.deck2);
		
		self.deck1.GUI.dom.prepend(self.deck1.flasher);
		self.deck2.GUI.dom.prepend(self.deck2.flasher);
		
		updateLoadingInfo();
/*
		$('<button>').css({margin: 'auto'}).text('Play In Sync').appendTo('body').bind('click', function(){
			if(self.deck1.isPlaying) self.deck1.stop(true);
			if(self.deck2.isPlaying) self.deck2.stop(true);
			
			self.deck1.playheadPosition = 60;
			self.deck2.playheadPosition = 60;

			
			self.deck1.play();
			self.deck2.play();
		});
*/
		var GlobalUIParent = $('<div>').css({"text-align": 'center'}).appendTo('#INTERFACE_CONTAINER');


		
		
		WebDJ.SongBrowser.renderList();
		
		self.deck2.on('barBeatJump', function(e){
			if(self.deck2.isPlaying && self.deck1.isPlaying){
				//self.startQuantized(self.deck1, self.deck2);				
				self.syncDeckBeats(self.deck1, self.deck2, true);
			}
		});
		
		self.deck1.on('barBeatJump', function(e){
			if(self.deck2.isPlaying && self.deck1.isPlaying){
				//self.startQuantized(self.deck2, self.deck1);
				self.syncDeckBeats(self.deck2, self.deck1, true);
			}
		});
		
		WebDJ.GUI.Decks[1].renderedControls.playbackRate.on('mouseup', function(e){ if(!e.shiftKey) self.syncDeckBPM(self.deck1, self.deck2); });
		WebDJ.GUI.Decks[0].renderedControls.playbackRate.on('mouseup', function(e){ if(!e.shiftKey) self.syncDeckBPM(self.deck2, self.deck1); });
	
		
		self.deck1.loadTrackByURL(WebDJ.rootFilePath+'E - Last Time (Knife Party Remix) - Labrinth.mp3', false);

		//self.deck1.loadTrackByURL(WebDJ.rootFilePath+'E - Duck Sauce - Barbra Streisand (Darth & Vader Remix).mp3', false);
		self.deck2.loadTrackByURL(WebDJ.rootFilePath+'E - Less Go! (Porter Robinson Remix) - Spencer & Hill feat. Lil Jon.mp3', false);


	};

	/*
	window.WebDJ.GUI.controlTemplates.button({
			label: 'Nudge ^A^ to beatmatch B>>',
			onClick: function(newVal, e){
				self.syncDeckBeats(self.deck2, self.deck1, e.shiftKey);
			}
		}).appendTo(GlobalUIParent);
		
		window.WebDJ.GUI.controlTemplates.button({
			label: 'Nudge ^B^ to beatmatch <<A',
			onClick: function(newVal, e){
				self.syncDeckBeats(self.deck1, self.deck2, e.shiftKey);
			}
		}).appendTo(GlobalUIParent);
		
	*/
	
	self.startQuantized = function(from, to){
		var msToNextMeasure = from.getMsToNextMeasure();
		
		console.log(msToNextMeasure);
		to.schedulePlayback(msToNextMeasure);
	};
	
	self.syncDeckBPM = function(from, to) {
		to.setSpeed(from.getComputedBPM() / to.trackBPM);
		to.trigger('bpmSync');
	};

	self.startQuantized = function(from, to){
		var msToNextMeasure = from.getMsToNextMeasure();
		
		console.log(msToNextMeasure);
		to.schedulePlayback(msToNextMeasure);
	};
	
	self.syncDeckBeats = function(from, to, alsoMatchMeasure){
		to.setSpeed(from.getComputedBPM() / to.trackBPM);
		var measureAdjust = 0;
		if(alsoMatchMeasure){
			var addlBeats = (from.barBeatPosition.beats<to.barBeatPosition.beats)? to.trackTimeSignature[0] : 0
			measureAdjust = to.barsBeatsToSeconds(0, (from.barBeatPosition.beats-to.barBeatPosition.beats) + addlBeats )
			
			console.log('matching measures!', 0, from.barBeatPosition.beats-to.barBeatPosition.beats);
			//to.jumpToBarBeatPosition(to.barBeatPosition.bars, from.barBeatPosition.beats-1, true);
		}
		
		// then we do beats.
		var timeTilNextBeatMaster	= from.getMsToNextBeat() / 1000;
		var timeTilNextBeatSlave	= to.getMsToNextBeat() / 1000;
		
		var to_msecPerBeat = 60000 / to.trackBPM;
		
		var shiftBySeconds	= timeTilNextBeatMaster - timeTilNextBeatSlave;
		
		if(shiftBySeconds*1000 > to_msecPerBeat / 2){
			shiftBySeconds = to_msecPerBeat/1000 - shiftBySeconds;
		}
		
		shiftBySeconds += measureAdjust;
				
		to.nudge(shiftBySeconds);
		
	}
	

	
	document.addEventListener('DOMContentLoaded', self.init);
	
	return self;
}());

WebDJ.UTIL = {
	msecToMSmS: function(ms){
		var msec = Math.floor(ms % 1000)
		  , toReturn = []
		  , timeParts = this.secondsToHMS( Math.floor(ms / 1000) );
		
		if(timeParts.h) //hours
			toReturn.push(timeParts.h, ':');
		
		toReturn.push(timeParts.m, ':', timeParts.s, '.', msec);
		
		return toReturn.join('');
		
	},
	secondsToHMS: function(seconds){
		if(seconds < 0) seconds = Math.abs(seconds);
		var hours = Math.floor(seconds / (60 * 60));

		var divisor_for_minutes = seconds % (60 * 60);
		var minutes = Math.floor(divisor_for_minutes / 60);

		var divisor_for_seconds = divisor_for_minutes % 60;
		var seconds = Math.floor(divisor_for_seconds);
	
		
		
		if(seconds == 60){
			minutes = minutes+1;
			seconds = 0;
		}
	
		if(seconds < 10) seconds = '0'+seconds.toString();
		if(minutes < 10) minutes = '0'+minutes.toString();
		
		if(hours == 0)
			hours = '';
		else
			hours = hours.toString();
			
			
	
		return {h: hours, m: minutes, s: seconds};
	},
	secondsToHMS_Formatted: function(seconds){
		var parts = this.secondsToHMS(seconds)
		  , toReturn = [];
		if(parts.h) //hours
			toReturn.push(parts.h, ':');
		
		toReturn.push(parts.m, ':', parts.s);
		
		return toReturn.join('');
	}
};

Math.scaleLog = function(percentage, minVal, maxVal, invert){
	if(percentage <= 0)
		return minVal;
	if(percentage >= 100)
		return maxVal;

// position will be between 0 and 100
	var minp = 0;
	var maxp = 100;

// The result should be between this range
		var minv = Math.log(minVal);
		var maxv = Math.log(maxVal);

// calculate adjustment factor
	var scale = (maxv-minv) / (maxp-minp);
	
	if(invert){
		return Math.exp(maxv - scale*(percentage-minp));
	}
	
	return Math.exp(minv + scale*(percentage-minp));
}

/* Can be used to grant several key functions (on, off, and trigger) to any object, allowing it to handle events.*/
function GiveThisObjectEventHandlingMethods(object){
	object.events = {};
	
	object.on = function( type, callback ){
		type = type.split(' ');
		for(var i=0; i<type.length; i++){
			object.events[ type[i] ] = object.events[ type[i] ] || [];
			object.events[ type[i] ].push( callback );
		}
	};
	
	object.off = function( type ){
		object.events[type] = [];
	};
	
	object.trigger = function( type ){
		if ( !object.events[type] ) return;
		var args = Array.prototype.slice.call(arguments, 1);
		for (var i = 0, l = object.events[type].length; i < l;  i++)
			if ( typeof object.events[type][i] == 'function' ) 
				object.events[type][i].apply(object, args);
	};
};
