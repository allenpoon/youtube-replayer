Replayer={
	text:{
		Loop:'Looping',
		Crop:'Cropped',
		Stop:'Stopped',
		ButtonFrom:'A',
		ButtonTo:'B',
		PlaceHolderFrom:'From',
		PlaceHolderTo:'To',
		TooltipFromButton:'Set current position as start of repeat',
		TooltipToButton:'Set current position as end of repeat',
		TooltipLoopToCrop:'Change to Crop',
		TooltipCropToStop:'Change to Stop',
		TooltipStopToLoop:'Change to Loop',
		TooltipFormat:'[ [ [ h: ] m: ] s. ] ms',
		TooltipFrom:'Start',
		TooltipTo:'End'
	},
	mode:{
		stop: 1,
		loop: 2,
		crop: 3
	},
	curMode: 1,

//	add \\ before \ because of string
	format:/^\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*$/,

	player:null,
	timer:null,
	duration:{
		start:null,
		end:null
	},
	setStop:function(){
		this.rmTimer();
	},
	setLoop:function(){
		this.rmTimer();
		if(this.player.getPlayerState()!==1||this.duration.end<=this.player.getCurrentTime()*1000||this.player.getCurrentTime()*1000<this.duration.start){
			if(this.player.getPlayerState()===2)
				this.player.playVideo();
			this.player.seekTo(this.duration.start/1000,true);
		}
		this.setTimer(function(){Replayer.setLoop()});
	},
	setCrop:function(){
		this.rmTimer();
		if(this.duration.end<=this.player.getCurrentTime()*1000)
			this.player.seekTo(this.player.getDuration(),true);
		else{
			if(this.player.getCurrentTime()*1000<this.duration.start)
				this.player.seekTo(this.duration.start/1000,true);
			this.setTimer(function(){Replayer.setCrop()});
		}
	},
	setTimer:function(f){
		this.timer=setTimeout(f,this.duration.end-this.player.getCurrentTime()*1000);
	},
//	Return change of time range
	setRange:function(){
		var start,end;
		start=this.getSecond($('#replayerTimerFrom'));
		end=this.getSecond($('#replayerTimerTo'));
		
		if(end<=0||end>(this.player.getDuration()+1)*1000)
			end=Math.floor(this.player.getDuration()*1000);
		if(start<0)	start=0;
		if(end<start){
			var tmp=start;
			start=end;
			end=tmp;
		}

		if(start==this.duration.start&&end==this.duration.end)return false;

		this.duration.start=start;
		this.duration.end=end;
		
		return true;
	},
	setA:function(){
		this.duration.start=Math.floor(this.player.getCurrentTime()*1000);
		if(!this.duration.end||this.duration.start>this.duration.end)
			this.duration.end=Math.floor(this.player.getDuration()*1000);
		this.showRepeatRange();
		this.toggle(this.curMode);
	},
	setB:function(){
		this.duration.end=Math.floor(this.player.getCurrentTime()*1000);
		if(!this.duration.start||this.duration.start>this.duration.end||this.duration.start<0)
			this.duration.start=0;
		this.showRepeatRange();
		this.toggle(this.curMode);
	},
	showRepeatRange:function(){
		$('#replayerTimerFrom').value=this.msToStr(this.duration.start);
		$('#replayerTimerTo').value=this.msToStr(this.duration.end);
	},
	rmTimer:function(){
		clearTimeout(this.timer);
		this.timer=null;
	},
	toggle:function(mode){
		if(!this.player||Object.keys(this.init.state).length!=0)
			setTimeout(function(m){Replayer.toggle(m)},100,mode);
		else if(this.player.getAdState()>0){
			$('video').addEventListener('durationchange', function(){
				var e=$('video');
				if(!isNaN(e.duration)){
					e.removeEventListener('durationchange',arguments.callee);
					Replayer.toggle(mode);
				}
			});
			setTimeout(function(m){Replayer.toggle(m)},(this.player.getDuration()-this.player.getCurrentTime())*1000,mode);
		}else{
			var e=$('#replayToggle');
			if(mode==this.mode.loop||!mode&&this.curMode==this.mode.stop){
				this.curMode=this.mode.loop;
				this.setRange()&&this.showRepeatRange();
				this.setLoop();
				e.innerHTML=this.text.Loop;
				e.title=e.dataset.tooltipText=this.text.TooltipLoopToCrop;
				$('video').loop=true;
			}else if(mode==this.mode.crop||!mode&&this.curMode==this.mode.loop){
				this.curMode=this.mode.crop;
				this.setRange()&&this.showRepeatRange();
				this.setCrop();
				e.innerHTML=this.text.Crop;
				e.title=e.dataset.tooltipText=this.text.TooltipCropToStop;
				$('video').loop=false;
			}else{
				this.curMode=this.mode.stop;
				this.rmTimer();
				e.innerHTML=this.text.Stop;
				e.title=e.dataset.tooltipText=this.text.TooltipStopToLoop;
				$('video').loop=false;
			}
		}
	},
	toSecond:function(v,l){
		if(v.constructor==String&&l==1){
			if(v.length>=3)return Number(v);
			if(v.length==2)return Number(v)*10;
			if(v.length==1)return Number(v)*100;
		}
		if(l<=4&&l>0)	return this.toSecond(Number(v)*[60,60,1000,1][4-l],l-1);
		return Number(v);
	},
	getSecond:function(e){
		var t=e.value.match(this.format);
		var count=4;
		switch(''){
			case t[1]:count--;
			case t[2]:count--;
			case t[3]:count--;
			case t[4]:count--;
		}
		return !!count?(this.toSecond(t[1],count)+this.toSecond(t[2],count-1)+this.toSecond(t[3],count-2)+this.toSecond(t[4],count-3)):0;
	},
// var str = [<ms>, <s>, <m>, <h>]
	msToStr:function(t){
		var str=[t%1000,(Math.floor(t/1000))%60,(Math.floor(t/(60*1000)))%60,(Math.floor(t/(60*60*1000)))];
		return(str[3]>9?(str[3]+':'):str[3]>0?('0'+str[3]+':'):'')
					+(str[2]>9?(str[2]+':'):str[2]>0?('0'+str[2]+':'):str[3]>0?'00:':'')
					+(str[1]>9?(str[1]+'.'):str[1]>0?('0'+str[1]+'.'):'00.')
					+(str[0]>99?str[0]:str[0]>9?'0'+str[0]:'00'+str[0]);
	},
	IndexedDB:{
		isOpen:false,
		isReqOpen:false,
		dbreq:null,
		db:null,
		waitingFunctionList:[],
		openDB:function(){
			if(!window.indexedDB)
				console.log('IndexedDB is not support, no data will be saved.');
			else if(!this.isOpen&&!this.isReqOpen){
				this.dbreq=window.indexedDB.open('YouTubeReplayer',1);
				this.dbreq.onsuccess=function(e){
					var o=Replayer.IndexedDB;
					o.db=e.target.result;
					o.isOpen=true;
					o.runWaitingFunction();
				};
				this.dbreq.onerror=function(e){};
				this.dbreq.onupgradeneeded=function(evt){
					var db=evt.target.result;
					if(!db.objectStoreNames.contains('replayRange')){
						db.createObjectStore('replayRange',{keyPath:'videoID'});
					}
				};
			}else if(this.isOpen) 
				this.runWaitingFunction();
			this.isReqOpen=true;
		},
		runWaitingFunction:function(){
			var f;
			while(f=this.waitingFunctionList.shift())
				f.constructor==Function&&f();
		},
		getInfoByVideoID:function(videoID,callback){
			this.waitingFunctionList.push(
				(function(vid,cb){
					return function(){
						Replayer.IndexedDB.db.transaction(['replayRange']).objectStore('replayRange').get(vid).onsuccess=function(evt){
// for Database upgrade
							!!evt.target.result&&!evt.target.result.curMode&&(evt.target.result.curMode=!!evt.target.result.autoPlay?Replayer.mode.loop:Replayer.mode.stop)&&delete evt.target.result.autoPlay;
							!!cb&&cb.constructor==Function&&cb(evt.target.result);
						};
					};
				})(videoID,callback)
			);
			this.openDB();
		},
		setInfo:function(videoID,Info,callback){
			this.waitingFunctionList.push(
				(function(vid,data,cb){
					return function(){
						data.videoID=vid;
						Replayer.IndexedDB.db.transaction(['replayRange'],'readwrite').objectStore('replayRange').put(data).onsuccess=function(evt){
							!!cb&&cb.constructor==Function&&cb(evt.target.result);
						};
					};
				})(videoID,Info,callback)
			);
			this.openDB();
		},
		init:function(){
			!this.isReqOpen&&this.openDB();
		}
	},
	reset:{
		ReplayerTimer:function(){Replayer.rmTimer()},
		Duration:function(){Replayer.duration={start:null,end:null}},
		Player:function(){Replayer.player=$('#movie_player');$('video').loop=false;},
		state:false,
		main:function(){
			if(!this.state){
				this.state=true;
				for(var x in this)
					this[x].constructor==Function&&this[x]();
				this.state=false;
			}
		}
	},
	unload:{
		SaveRecord:function(){
			if(Replayer.duration.start!=null)
				Replayer.IndexedDB.setInfo(
					Replayer.init.curVideoID,
					{
						start:Replayer.duration.start,
						end:Replayer.duration.end,
						curMode:Replayer.curMode
					},
					null
				)
		},
		state:false,
		main:function(){
			if(!this.state){
				this.state=true;
				for(var x in this)
					this[x].constructor==Function&&this[x]();
				this.state=false;
			}
		}
	},
	init:{
		SetUnloadHandler:function(){
			if(!this.unloadHandler){
				window.addEventListener('beforeunload', function(){Replayer.unload.main()});
				this.unloadHandler=true;
			}
			this.state.unloadHandler=!!this.unloadHandler;
		},
		ReplayerLayout:function(){
			var e=$('#watch8-secondary-actions');
			if(!(this.state.replayer=!!this.state.replayer)&&!!e){
				var span,input,format=Replayer.text.TooltipFormat;

				span=document.createElement('span');
				input=document.createElement('input');
				input.placeholder=Replayer.text.PlaceHolderFrom;
				input.size=8;
				input.title=Replayer.text.TooltipFrom+' - '+format;
				input.className='yt-uix-tooltip yt-uix-button yt-uix-button-text yt-uix-button-opacity';
				input.style.textAlign='center';
				input.id='replayerTimerFrom';
				input.addEventListener('keyup',function(){if(window.event.keyCode==13){Replayer.toggle(Replayer.curMode!=Replayer.mode.stop?Replayer.curMode:Replayer.mode.crop);};},false);
				span.appendChild(input);
				e.appendChild(span);

				span=document.createElement('span');
				input=document.createElement('button');
				input.id='replayerA';
				input.title=Replayer.text.TooltipFromButton;
				input.className='yt-uix-tooltip yt-uix-button yt-uix-button-text yt-uix-button-opacity';
				input.addEventListener('click',function(){Replayer.setA()},false);
				input.textContent=Replayer.text.ButtonFrom;
				span.appendChild(input);
				e.appendChild(span);

				span=document.createElement('span');
				input=document.createElement('button');
				input.id='replayerB';
				input.title=Replayer.text.TooltipToButton;
				input.className='yt-uix-tooltip yt-uix-button yt-uix-button-text yt-uix-button-opacity';
				input.addEventListener('click',function(){Replayer.setB()},false);
				input.textContent=Replayer.text.ButtonTo;
				span.appendChild(input);
				e.appendChild(span);

				span=document.createElement('span');
				input=document.createElement('input');
				input.placeholder=Replayer.text.PlaceHolderTo;
				input.size=8;
				input.title=Replayer.text.TooltipTo+' - '+format;
				input.className='yt-uix-tooltip yt-uix-button yt-uix-button-text yt-uix-button-opacity';
				input.style.textAlign='center';
				input.id='replayerTimerTo';
				input.addEventListener('keyup',function(){if(window.event.keyCode==13){Replayer.toggle(Replayer.curMode!=Replayer.mode.stop?Replayer.curMode:Replayer.mode.crop);};},false);
				span.appendChild(input);
				e.appendChild(span);

				span=document.createElement('span');
				input=document.createElement('button');
				input.id='replayToggle';
				input.title=Replayer.text.TooltipStopToLoop;
				input.className='yt-uix-tooltip yt-uix-button yt-uix-button-text yt-uix-button-opacity';
				input.addEventListener('click',function(){Replayer.toggle();},false);
				input.textContent=Replayer.text.Stop;
				span.appendChild(input);
				e.appendChild(span);
			}
			if(!!$('#watch8-secondary-actions #replayerTimerFrom')&&
				!!$('#watch8-secondary-actions #replayerA')&&
				!!$('#watch8-secondary-actions #replayerB')&&
				!!$('#watch8-secondary-actions #replayerTimerTo')&&
				!!$('#watch8-secondary-actions #replayToggle'))
				this.state.replayer=true;
		},
		ChangeYouTubeLayout:function(){
			var e,eL;
			if(this.state.replayer){
				if(!(this.state.likeDislike=!!this.state.likeDislike)){
					e=$('#watch-like-dislike-buttons');
					!!e&&(eL=e.querySelectorAll('.yt-uix-button-content'))||(eL=[]);
					for(var i=0;i<eL.length;i++)
						this.state.likeDislike=!!eL[i]&&!!eL[i].parentNode.removeChild(eL[i]);
					!!e&&(eL=e.querySelectorAll('button'))||(eL=[]);
					for(var i=0;i<eL.length;i++)
						if(!!eL[i]){
							eL[i].style.padding='0 5px';
							eL[i].querySelector('span').style.margin='0';
							eL[i].querySelector('.yt-uix-button-icon').style.margin='0';
						}
					this.state.likeDislike=true;
				}
			}
		},
		ChangeQuanlity:function(){
			if(!this.state.playerQuality)
				Replayer.player.setPlaybackQuality(Replayer.player.getAvailableQualityLevels()[0]);
			this.state.playerQuality=(Replayer.player.getPlaybackQuality()==Replayer.player.getAvailableQualityLevels()[0]);
		},
		LoadInfoAndRun:function(){
			if(this.state.replayer&&!(this.state.IDBOpenReq=!!this.state.IDBOpenReq)){
				Replayer.IndexedDB.init();
				this.state.IDBOpenReq=Replayer.IndexedDB.isReqOpen;
				Replayer.IndexedDB.getInfoByVideoID(yt.config_.VIDEO_ID,function(info){
					if(!!info){
						Replayer.duration.start=info.start;
						Replayer.duration.end=info.end;
						Replayer.curMode=info.curMode;
						Replayer.showRepeatRange();
						Replayer.toggle(info.curMode);
					}
				});
			}
		},
		curVideoID:'',
		changing:false,
		state:{},
		main:function(){
			if(!this.changing){
				this.changing=true;
				if(!yt.config_.VIDEO_ID)
					this.curVideoID=null;
				else{
					if(this.curVideoID!=yt.config_.VIDEO_ID){
						!!this.curVideoID&&Replayer.unload.main();
						Replayer.reset.main();
					}
					var isNeedReset=(!!yt.config_.VIDEO_ID&&this.curVideoID!=yt.config_.VIDEO_ID);
					for(var x in this.state)
						if(isNeedReset=(isNeedReset||!this.state[x]))break;
					if(isNeedReset){
						Replayer.init.curVideoID=yt.config_.VIDEO_ID;
//						try{
							for(var x in this)
								this[x].constructor==Function&&this[x]();
							var result=true;
							for(var x in this.state)
								result&=this.state[x];
							if(result)
								this.state={};
							else 
								setTimeout(function(){Replayer.init.main()});
//						}catch(e){
//							console.log(e);
//						}
					}
				}
				this.changing=false;
			}
		}
	}
}
