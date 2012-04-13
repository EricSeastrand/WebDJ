// Uses the Chrome Audio API in an attempt to emulate the functionality of a Pioneer DJM series mixer.
window.audioUtilities.VirtualDJM = function(context, sendOutputTo){
	var self = {
		context : context,
		channels: []
	};
	
	
	
	self.addChannel = function(sourceNode){
		var newChannel = CreateNewChannelObject(sourceNode);
		self.channels.push( newChannel );
		newChannel.doRouting();
	};
	
	
/* Function that gets called to make a new channel */
	function CreateNewChannelObject(fromAudioSourceNode){
		var self = {
			components	: [],
			input		: context.createGainNode()
		};
	
		var components = [
			'lowPass',
			'highPass',
		];
						
		console.log('created new channel from', fromAudioSourceNode);
		
		// Iterate through the list of components in the chain, creating an instance of each one
		for(var i=0; i<components.length; i++){
			var componentName = components[i];
			self.components.push(window.audioUtilities.components[componentName](context));
		}
		
		
		
		self.doRouting = function(){
			(fromAudioSourceNode.output || fromAudioSourceNode).connect(self.input);
			console.log('Routing input from ', fromAudioSourceNode, 'to deck\'s ', self.input);
			
			/*
			self.input.connect(splitter);
			console.log('Routing input from deck\'s ', self.input, 'to deck\'s ', splitter);

			splitter.connect(polarityInverter);
			console.log('Routing input from deck\'s ', splitter, 'to deck\'s ', polarityInverter);
			
			*/
			
			if(self.components[0]){
				self.input.connect(self.components[0]);
				console.log('Routing input from deck\'s ', self.input, 'to deck\'s ', self.components[0]);
			}
			
			// Iterate through the previously instanciated components to set their routing. 
			var totalComponents = self.components.length;
			for(var i=1; i<totalComponents; i++){
				var routeFrom = self.components[i-1]
				var routeTo = self.components[i];
				console.log('Routing input from deck\'s plugin '+i+', ', routeFrom, ', to deck\'s plugin '+(i+1)+' ', routeTo);
				routeFrom.connect(routeTo)
			}
			
			(self.components[self.components.length - 1] || self.input).connect(sendOutputTo);
			console.log('Routing input from deck\'s ', (self.components[self.components.length - 1] || self.input), 'to mixers output ', sendOutputTo);

		};
		
		
		return self;
	}
		
	return self;
};