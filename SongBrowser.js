WebDJ.SongBrowser = (function(){
	var self = {};
	
	self.initDom = function(){
		self.dom = {
			container: $('<div>').addClass('song-browser').appendTo('#INTERFACE_CONTAINER')
		};
		
		self.dom.fileList = $('<ul>').appendTo(self.dom.container);
		
		self.dom.fileList.on('mousedown', 'li', function(e){
			e.preventDefault(); e.stopPropagation();
			var fileInfo = $(this).data('fileInfo');
			
			$(document).one('mouseup', function(e){
				var deckAPI = $(e.srcElement).closest('.deck-container').data('deckAPI');
				deckAPI.loadTrackByURL(WebDJ.rootFilePath+fileInfo.fileName);
				console.log(deckAPI, this);
			})
		});
		
		self.hasInitialized = true;
	};
	
	
	self.renderList = function(){
		if(!self.hasInitialized) self.initDom();
		
		var fileList = WebDJ.SongInfo.knownFiles;
		
		for(var i=0; i<fileList.length; i++){
			$('<li>')
				.data('fileInfo', fileList[i])
				.text(fileList[i].fileName)
				.appendTo(self.dom.fileList);
		}
	};
	
	return self;
}());