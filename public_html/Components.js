window.audioUtilities.components.ericsFilter = function(context){
	//var self = context.createBiquadFilter();
	var self = context.createJavaScriptNode(256, 1, 1);
	self.filterComponent = new Biquad();

	self.setType = function(){
		
	};
/*	
	self.routeTo = function(audioDestinationNode){
		self.connect(audioDestinationNode);
	}
	*/
	self.onaudioprocess = function(event){
		// Get Float32Array output buffer.
		var l = event.inputBuffer.getChannelData(0)
		  , r = event.inputBuffer.getChannelData(1)
		  , lOut = event.outputBuffer.getChannelData(0)
		  , rOut = event.outputBuffer.getChannelData(1)
		;
		/*
		for (var i = 1; i < event.outputBuffer.length; i++) {
			l[i] =  l[i]  + (l[i-1] * self.scale);
			r[i] =  r[i]  + (r[i-1] * self.scale);
		}
		*/
		
		lOut.set(self.filterComponent.process(l));
		rOut.set(self.filterComponent.process(r));
	};
	
	return self;
};

window.audioUtilities.components.lowPass = function(context){
	var self = context.createBiquadFilter();

	self.setType = function(){
		
	};
	
	self.routeTo = function(audioDestinationNode){
		self.connect(audioDestinationNode);
	}

	
	
	return self;
};

window.audioUtilities.components.highPass = function(context){
	var self = context.createBiquadFilter();
	self.type = 1;
	
	self.setType = function(){
		
	};
	
	self.routeTo = function(audioDestinationNode){
		self.connect(audioDestinationNode);
	}

	
	
	return self;
};

window.audioUtilities.components.polarityInvert = function(context){
	var self = context.createJavaScriptNode(256, 1, 1);
	
	self.onaudioprocess = function(event){
		// Get Float32Array output buffer.
		var l = event.inputBuffer.getChannelData(0)
		  , r = event.inputBuffer.getChannelData(1)
		  , lOut = event.outputBuffer.getChannelData(0)
		  , rOut = event.outputBuffer.getChannelData(1)
		;
		
		for (var i = 0; i < event.outputBuffer.length; i++) {
			l[i] = l[i] * -1;
			r[i] = r[i] * -1;
		}
		
		lOut.set(l);
		rOut.set(r);
	};
	
	return self;
};

window.audioUtilities.components.parametricEQ = function(context){
	var self = context.createGainNode()
	  , outputGainNode = context.createGainNode()
	  , gain = context.createGainNode()
	  , polarityInverter = self.polarityInverter = audioUtilities.components.polarityInvert(context)
	  , filter = self.filterComponent = context.createBiquadFilter()
	;
	
	filter.type = 1;
	
	self.connect(outputGainNode);
	
	self.connect(filter);
	filter.connect(polarityInverter);
	polarityInverter.connect(outputGainNode);

	self.params = {
		gain: gain.gain,
		freq: filter.frequency
	};
	
	self.connect = function(audioDestinationNode){
		outputGainNode.connect(audioDestinationNode);
	};
	
	
	return self;
};