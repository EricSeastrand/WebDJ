// Makes a new instance of a virtual CDJ, intended to emulate the functionality of the Pioneer CDJ series CD/MP3 decks
window.audioUtilities.VirtualCDJ = function(context){
	var self = {
		context		: context,
		source		: false,
		gainNode	: context.createGainNode(),
		loadedTrack	: false,
		buffers		: {},
		syncSource	: false,
		nowPlaying	: '',
		lastFileLoaded: '',
		playheadPosition: 0,
		barBeatPosition: {
			bars: 0,
			beats: 0,
			beatPct: 0
		},
		flasher		: WebDJ.GUI.viewTemplates.bpmFlasher(),
		trackStartOffset: 0,
		trackBPM	: 128,
		trackTimeSignature: [4,4],
		playheadPositionAtLastSpeedChange: 0,
		playbackRate: 1
	};
	
	GiveThisObjectEventHandlingMethods(self);
	
	function loadIntoBufferSource(url){
		var newBufferSource = context.createBufferSource();
		newBufferSource.buffer = WebDJ.cache[url];
		
		self.buffers[url] = newBufferSource;
		self.lastFileLoaded = url;
		if(!self.source) self.source = self.buffers[url];
		console.log('new buffer created for '+url,  newBufferSource);
		updateLoadingInfo();
		return newBufferSource;
	};
	
	self.loadTrackByURL = function(url, playAfterLoading){
		self.isLoadingTrackURL = url;
		self.trigger('startedLoading', url);
		
		var afterDecode = function(url){
			loadIntoBufferSource(url);
			
			self.isLoadingTrackURL = false;
			
			self.trigger('bufferLoaded', url);
			
			if(!self.isPlaying)
				self.findAndLoadSongInfo(url);
			
			if(playAfterLoading)
				self.play(url);
		};
		
		if(WebDJ.cache[url]){
			afterDecode(url);
			return;
		}
		
		var request = new XMLHttpRequest();
			request.open('GET', url, true);
			request.responseType = 'arraybuffer';
			request.addEventListener('load', function(){
				console.log('Starting to decode '+url);
				context.decodeAudioData(request.response, function(buffer){
					WebDJ.cache[url] = buffer;
					afterDecode(url);
				}, function(e){console.log(e); alert("An unknown error occurred when trying to decode the track:\n"+url, e);});
				
			}, false);
		
		request.send();
		
	};

	self.loadTrackByFileAPI = function(url, arrayBuffer){
		self.isLoadingTrackURL = url;
		self.trigger('startedLoading', url);
		
		var afterDecode = function(url){
			loadIntoBufferSource(url);
			
			self.isLoadingTrackURL = false;
			
			self.trigger('bufferLoaded', url);
			
			if(!self.isPlaying)
				self.findAndLoadSongInfo(url);
			
			if(playAfterLoading)
				self.play(url);
		};
		
		if(WebDJ.cache[url]){
			afterDecode(url);
			return;
		}
		
		console.log('Starting to decode '+url);
		context.decodeAudioData(arrayBuffer, function(buffer){
			WebDJ.cache[url] = buffer;
			afterDecode(url);
		},
			function(e){console.log(e); alert("An unknown error occurred when trying to decode the track:\n"+url, e);}
		);
				
		
	};
	
	self.beatsMeasureCalculator = (function(){
		var interval = false
		  , elapsedMsec
		  , msecFromNextBeat
		  , measureProgress
		  , msecPerBeat
		  , msecPerMeasure
		  , computedBeatNumber
		  , computedMeasureNumber
		;
		var me = {
			updateOnInterval: function(){
				msecPerMeasure	= 60000*self.trackTimeSignature[0] / self.getComputedBPM();
				msecPerBeat		= msecPerMeasure/4;
				interval		= window.setInterval(calculate, 5);
			}
		};
		
		var calculate = function(){
			if(!self.isPlaying){ window.clearInterval(interval); return; }
			
			elapsedMsec			= self.updatePlayheadPosition();
			
			msecFromNextBeat	= (elapsedMsec % msecPerBeat);
			measureProgress = ( ( elapsedMsec / msecPerMeasure ) % 1 ) * 100;
			
			computedMeasureNumber = Math.floor(elapsedMsec / msecPerMeasure);
			
			if(measureProgress < 25){
				computedBeatNumber = 1;
			}else if(measureProgress < 50){
				computedBeatNumber = 2;
			}else if(measureProgress < 75){
				computedBeatNumber = 3;
			}else{
				computedBeatNumber = 4;
			}
			
			computedMeasureNumber++; // In music, we would start with measure 1, not measure 0.
			
			if(computedBeatNumber != self.barBeatPosition.beats || computedMeasureNumber != self.barBeatPosition.bars){
				self.barBeatPosition.beats	= computedBeatNumber;
				self.barBeatPosition.bars	= computedMeasureNumber;
				self.trigger('beatChange', self.barBeatPosition);
			}
		}
		
		return me;
	}());
	
	self.getNowPlayingFilename = function(){
		return self.nowPlaying || self.lastFileLoaded;
	};
	
	self.play = function(url, scheduleTime){
		url = url || self.nowPlaying || self.lastFileLoaded;
		if(!scheduleTime) scheduleTime = self.source.context.currentTime;

		console.log('setting buffer as source: '+url, self.buffers[url]);
		self.source = self.buffers[url];
		if(!self.source){ console.log('Buffer play attempted but no buffer was found for '+url); return; }
		
		self.source.connect(self.gainNode);
		self.source.playbackRate.value = self.playbackRate || 1;
		self.playheadStartedAt = self.playheadPosition;
		
		var startPlayingFromHere = self.playheadPosition+self.trackStartOffset - .003; // 3ms latency compensation
		var howLongToPlay = self.source.buffer.duration-startPlayingFromHere;
		
		console.log('starting play in '+Math.floor( (scheduleTime - self.source.context.currentTime) * 1000)+'ms from point: ',startPlayingFromHere, 'until',howLongToPlay, 'duration:', (howLongToPlay - startPlayingFromHere), 'clip duration', self.source.buffer.duration);
		self.source.noteGrainOn(scheduleTime, startPlayingFromHere, howLongToPlay);//( - self.playheadPosition)-0.057
		self.beatsMeasureCalculator.updateOnInterval();
		
		self.flasher.data('startFlashing')(self.trackBPM * self.source.playbackRate.value, self.updatePlayheadPosition);
		
		self.playingStartedAt = self.source.context.currentTime;
		self.nowPlaying = url;
		self.isPlaying = true;
		
		self.trigger('playStart', self.playheadPosition, self.source.buffer.duration-self.trackStartOffset);
	};
	
	self.schedulePlayback = function(millisecondsFromNow){
		if(self.isPlaying)
			self.stop();
		
		self.play(undefined, self.source.context.currentTime + (millisecondsFromNow / 1000) );
	};
	
	self.scheduleAtBarBeat = function(bars, beats, msFromNow){
		if(!msFromNow && self.syncSource && self.syncSource.isPlaying)
			msFromNow = self.syncSource.getMsToNextBeat();
		
		if(self.isPlaying) self.stop();
		
		self.playheadPosition = self.barsBeatsToSeconds(bars, beats);
		self.play();
		window.setTimeout(self.play, msFromNow - 100);
		
	};
	
	
	
	self.stop = function(resetPlayhead){
		self.isPlaying = false;
		self.lastPlayed = self.nowPlaying;
		self.nowPlaying = false;
		self.source.noteOff(0);
		if(self.lastPlayed != self.lastFileLoaded || resetPlayhead === true)	self.playheadPosition = 0;
		self.trigger('playheadChange', self.playheadPosition, self.source.buffer.duration-self.trackStartOffset);
		self.flasher.data('stopFlashing')();
		self.source.disconnect(0);
		reloadCurrentTrack();
		
	};
	
	self.barsBeatsToSeconds = function(bars, beats){
		var totalBeats = (bars-1) * self.trackTimeSignature[0] + beats;
		
		return totalBeats / self.trackBPM * 60;
	};
	
	self.jumpToBarBeatPosition = function(bars, beats, addMsec){
		//var addSec = addMsec? (addMsec/1000) : 0;
		if(self.isPlaying) self.stop();
		
		self.playheadPosition = self.barsBeatsToSeconds(bars, beats);
		
		self.play();
		if(!addMsec)
			self.trigger('barBeatJump', {bars: bars, beats: beats, sec: self.playheadPosition});
	};
	
	self.setOffsetRealTime = function(newOffset, keepPlaying){
		self.trackStartOffset = newOffset;
		if(self.isPlaying){
			self.stop(keepPlaying);
			self.play();
		}
	};
	
	self.nudge = function(seconds){
		if(self.isPlaying){
			self.stop();
			var wasPlaying = true;
		}
		self.playheadPosition = self.playheadPosition + seconds;
		if(wasPlaying)
			self.play();
	};
	
	self.getComputedBPM = function(){
		self.computedBPM = self.trackBPM * (self.playbackRate || 1);
		return self.computedBPM;
	}
	
	self.getComputedTotalTime = function(){
		return self.source.buffer.duration * (1 / self.source.playbackRate.value);
	}
	
	self.nudgeBeats = function(beats){
		if(self.isPlaying){
			self.stop();
			var wasPlaying = true;
		}
		// It might seem more logical to just add the number of milliseconds in a beat to the current playhead
		// however, this will cause rounding error and it will quickly accumulate, causing issues.
		/* But I'm not good enough at math to figure that out, so we'll use the hackish method below.
		var currentBeats = self.barBeatPosition.bars * self.trackTimeSignature[0] + self.barBeatPosition.beats;
				
		var desiredBeats = currentBeats + beats;
		
		var newPlayheadPosition = desiredBeats / self.trackBPM / 60;
		
		console.log('was at', currentBeats, 'going to ', desiredBeats, ' seconds:',newPlayheadPosition - self.playheadPosition);

		self.playheadPosition = newPlayheadPosition;
		self.playheadPosition +=  ( (msecPerBeat * beats) / 1000 );
	
		var msecPerBeat	= 60000 / self.trackBPM;
			*/
		self.jumpToBarBeatPosition(self.barBeatPosition.bars, self.barBeatPosition.beats+beats, self.getMsSinceLastBeat());
		
		if(wasPlaying)
			self.play();
	};
	
	self.findAndLoadSongInfo = function(url){
		if(self.nowPlaying == url && self.trackBPM) return;
		
		var songInfo = window.WebDJ.SongInfo.getInfoFor(url);
		if(songInfo){
			self.trackStartOffset	= songInfo.offset || self.trackStartOffset;
			self.trackBPM			= songInfo.bpm || 0;
			self.trackCuePoints		= songInfo.cuePoints || [];
		}
		
		//self.GUI.class.renderedControls.startOffset.data('input-element').attr({value: self.trackStartOffset * 1000}).trigger('change.noPropagation');
		self.trigger('songInfoLoaded', songInfo);
	};
	
	self.updatePlayheadPosition = function(){
		var elapsed = self.source.context.currentTime - self.playingStartedAt;
		self.playheadPosition = self.playheadStartedAt + elapsed;
		self.calculatedPlayheadPosition = (self.playheadPosition - self.playheadPositionAtLastSpeedChange) * 1000 + ( self.playheadPositionAtLastSpeedChange*1000 * (1/ self.source.playbackRate.value) );
		self.trigger('playheadChange', self.playheadPosition, self.source.buffer.duration-self.trackStartOffset);
		return self.calculatedPlayheadPosition;
	};
	
	self.getMsToNextBeat = function(){
		var msecPerBeat			= 60000 / self.trackBPM;
		return self.updatePlayheadPosition() % msecPerBeat;
	};
	
	self.getMsSinceLastBeat = function(){
		var msecPerBeat			= 60000 / self.trackBPM;
		return self.playheadPosition*1000 % msecPerBeat;
	};
	
	self.getMsToNextMeasure = function(){
		var msecPerBeat	= 60000 / self.trackBPM;
				
		var msecForBeats = ( self.trackTimeSignature[0] - self.barBeatPosition.beats ) * msecPerBeat;

		return (self.updatePlayheadPosition() % msecPerBeat) + msecForBeats;
	};
	
	
	function reloadCurrentTrack(){
		if(!self.lastFileLoaded && !self.lastPlayed){
			console.log('reloadCurrentTrack was called but nowPlaying was a falsey value.');
			return;
		}
		self.loadTrackByURL(self.lastFileLoaded || self.lastPlayed);
	}
	
	self.setSpeed = function(newRate){
		self.playbackRate = self.source.playbackRate.value = newRate;
		self.flasher.data('startFlashing')(self.trackBPM * self.source.playbackRate.value, self.updatePlayheadPosition);
		self.playheadPositionAtLastSpeedChange = self.playheadPosition;
		self.getComputedBPM();
	};
	
	self.connect = function(toAudioDestinationNode){
		return self.gainNode.connect(toAudioDestinationNode);
	}
	
	self.setGain = function(newGain){
		self.gainNode.gain.value = newGain;
	}

	

	return self;
};