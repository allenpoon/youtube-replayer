{
	let script = document.createElement('script');
	script.innerHTML = "'use strict';if(!('$' in window)){window.$=(a)=>document.querySelector(a)};({text:{Loop:'├⭮┤',Crop:'├⏵┤',Stop:'⏵',ButtonFrom:'A',ButtonTo:'B',PlaceHolderFrom:'From',PlaceHolderTo:'To',TooltipFromButton:'Set now as the start',TooltipToButton:'Set now as the end',TooltipLoopToCrop:'Looping; Click to Crop',TooltipCropToStop:'Cropped; Click to Normal',TooltipStopToLoop:'Normal; Click to Loop',TooltipFormat:'[ [ [ [ h: ] m: ] s. ] ms ]',TooltipFrom:'Start',TooltipTo:'End'},ui:{},mode:{stop:1,loop:2,crop:3},curMode:1,format:/^\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*$/,duration:{},setStop:function(){this.curMode=this.mode.stop;this.video.loop=!1;this.rmTimer()},setLoop:function(){this.curMode=this.mode.loop;let p=this.player;if(this.duration.to<=p.getCurrentTime()||p.getCurrentTime()<=this.duration.from)p.seekTo(this.duration.from,!0);this.video.loop=!0;if(this.duration.to<p.getDuration())if(p.getPlayerState()===1||p.getPlayerState()===3)this.setTimer(()=>this.setLoop())},setCrop:function(){this.curMode=this.mode.crop;let p=this.player;if(this.duration.to<=p.getCurrentTime()&&p.getPlayerState()===1)p.seekTo(p.getDuration(),!0);else if(p.getCurrentTime()<this.duration.from)p.seekTo(this.duration.from,!0);this.video.loop=!1;if(this.duration.to<p.getDuration())if(p.getPlayerState()===1||p.getPlayerState()===3)this.setTimer(()=>this.setCrop())},setTimer:function(f){this.rmTimer();this.timer=setTimeout(f,(this.duration.to-this.player.getCurrentTime())*1000/this.player.getPlaybackRate())},setRange:function(){if(!this.ui.ready)return;let s,e;s=this.getSecond(this.ui.fromRange);e=this.getSecond(this.ui.toRange);if(e<=0||e>this.player.getDuration()+1)e=this.player.getDuration();if(s<0)s=0;if(e<s){let t=s;s=e;e=t}this.duration.from=s;this.duration.to=e;return!0},setA:function(){this.duration.from=this.player.getCurrentTime();if(!this.duration.to||this.duration.from>this.duration.to)this.duration.to=this.player.getDuration();this.updateInterface();this.toggle(this.curMode)},setB:function(){this.duration.to=this.player.getCurrentTime();if(!this.duration.from||this.duration.from>this.duration.to||this.duration.from<0)this.duration.from=0;this.updateInterface();this.toggle(this.curMode)},updateInterface:function(){if(this.ui.ready){if(this.duration.from||this.duration.to){let e=this.ui,eB=e.actionButton;e.fromRange.value=this.msToStr(~~(this.duration.from*1000));e.toRange.value=this.msToStr(~~(this.duration.to*1000));switch(this.curMode){case this.mode.loop:eB.innerHTML=this.text.Loop;eB.title=eB.dataset.tooltipText=this.text.TooltipLoopToCrop;break;case this.mode.crop:eB.innerHTML=this.text.Crop;eB.title=eB.dataset.tooltipText=this.text.TooltipCropToStop;break;case this.mode.stop:eB.innerHTML=this.text.Stop;eB.title=eB.dataset.tooltipText=this.text.TooltipStopToLoop;break}}}},rmTimer:function(){clearTimeout(this.timer);this.timer=null},toggle:function(mode){if(mode==this.mode.loop||(!mode&&this.curMode==this.mode.stop))this.setLoop();else if(mode==this.mode.crop||(!mode&&this.curMode==this.mode.loop))this.setCrop();else this.setStop();this.updateInterface()},getSecond:function(e){let t=e.value.match(this.format),c=4,ms=(v,l)=>{if(v.constructor==String&&l==1){if(v.length>=3)return Number(v);if(v.length==2)return Number(v)*10;if(v.length==1)return Number(v)*100}if(l<=4&&l>0)return ms(Number(v)*[60,60,1000,1][4-l],l-1);return Number(v)};switch(''){case t[1]:c--;case t[2]:c--;case t[3]:c--;case t[4]:c--}return c?(ms(t[1],c)+ms(t[2],c-1)+ms(t[3],c-2)+ms(t[4],c-3))/1000:0},msToStr:function(t){let s=[t%1000,~~(t/1000)%60,~~(t/(60*1000))%60,~~(t/(60*60*1000))];return(s[3]>9?(s[3]+':'):s[3]>0?('0'+s[3]+':'):'')+(s[2]>9?(s[2]+':'):s[2]>0?('0'+s[2]+':'):s[3]>0?'00:':'')+(s[1]>9?(s[1]+'.'):s[1]>0?('0'+s[1]+'.'):'00.')+(s[0]>99?s[0]:s[0]>9?'0'+s[0]:'00'+s[0])},IndexedDB:{isOpen:!1,isReqOpen:!1,waitingFunctionList:[],openDB:function(){if(!window.indexedDB)console.log('IndexedDB is not support, no data will be saved.');else if(!this.isOpen&&!this.isReqOpen){this.dbreq=window.indexedDB.open('YouTubeReplayer',1);this.dbreq.onsuccess=(e)=>{this.db=e.target.result;this.isOpen=!0;this.runWaitingFunction()};this.dbreq.onerror=(e)=>0;this.dbreq.onupgradeneeded=(evt)=>{let db=evt.target.result;if(!db.objectStoreNames.contains('replayRange'))db.createObjectStore('replayRange',{keyPath:'videoID'})}}else if(this.isOpen)this.runWaitingFunction();this.isReqOpen=!0},runWaitingFunction:function(){let f;while(f=this.waitingFunctionList.shift())f.constructor==Function&&f()},getInfoByVideoID:function(vid,cb){this.waitingFunctionList.push(()=>{this.db.transaction(['replayRange']).objectStore('replayRange').get(vid).onsuccess=(evt)=>{let r=evt.target.result;if(r){!r.curMode&&(r.curMode=r.autoPlay?this.parent.mode.loop:this.parent.mode.stop)&&delete r.autoPlay;r.end&&(r.to=r.end/1000)&&delete r.end;r.start&&(r.from=r.start/1000)&&delete r.start;r.to&&!r.from&&(r.from=0)}cb&&cb.constructor==Function&&cb(r)}});this.openDB()},setInfo:function(data,cb){this.waitingFunctionList.push(()=>this.db.transaction(['replayRange'],'readwrite').objectStore('replayRange').put(data).onsuccess=(evt)=>cb&&cb.constructor==Function&&cb(evt.target.result));this.openDB()},init:function(){!this.isReqOpen&&this.openDB()}},unload:{SaveRecordAndRemoveTimer:function(){let p=this.parent;if(p.videoID&&p.duration.to){p.IndexedDB.setInfo({videoID:p.videoID,from:p.duration.from,to:p.duration.to,curMode:p.curMode},()=>(p.duration={}))}p.setStop();p.videoID=null},RemoveUIRef:function(){this.parent.ui={}},main:function(){if(!this.changing){this.changing=!0;for(let x in this)this[x].constructor==Function&&this[x]();this.changing=!1}}},init:{SetLayout:function(){if(!(this.state.replayer|=0)){let e=$('#watch8-secondary-actions');if(e){let p=this.parent,t=p.text,f=t.TooltipFormat,nE=document.createElement('div'),nEc=nE.children;nE.classList.add('yt-uix-menu','yt-uix-button-opacity','yt-uix-button-text');nE.style.border='2px solid grey';nE.style.borderRadius='10px';nE.innerHTML='<input size=6 placeholder=\"'+t.PlaceHolderFrom+'\" title=\"'+t.TooltipFrom+' - '+f+'\" class=\"yt-uix-tooltip yt-uix-button\" style=\"text-align:right;font-size:larger;font-weight:bold\"><button title=\"'+t.TooltipFromButton+'\" class=\"yt-uix-tooltip yt-uix-button\" style=\"text-align:center;font-size:larger;font-weight:bold\">'+t.ButtonFrom+'</button><button class=\"yt-uix-button\" style=\"font-size:larger;font-weight:bold\">-</button><button title=\"'+t.TooltipToButton+'\" class=\"yt-uix-tooltip yt-uix-button\" style=\"text-align:center;font-size:larger;font-weight:bold\">'+t.ButtonTo+'</button><input size=6 placeholder=\"'+t.PlaceHolderTo+'\" title=\"'+t.TooltipTo+' - '+f+'\" class=\"yt-uix-tooltip yt-uix-button\" style=\"text-align:left;font-size:larger;font-weight:bold\"><button title=\"'+t.TooltipStopToLoop+'\" class=\"yt-uix-tooltip yt-uix-button\" style=\"text-align:center;font-size:large;font-weight:bold;width:65px\">'+t.Stop+'</button>';e.insertBefore(nE,e.lastChild);let ui=this.parent.ui,keyEvt=(evt)=>evt.keyCode==13&&p.setRange()&&p.toggle(p.curMode!=p.mode.stop?p.curMode:p.mode.crop);(ui.fromRange=nEc[0]).addEventListener('keyup',keyEvt,!1);(ui.aButton=nEc[1]).addEventListener('click',()=>p.setA(),!1);(ui.bButton=nEc[3]).addEventListener('click',()=>p.setB(),!1);(ui.toRange=nEc[4]).addEventListener('keyup',keyEvt,!1);(ui.actionButton=nEc[5]).addEventListener('click',()=>p.toggle(),!1);this.state.replayer=!0}}},UpdateInterface:function(){if(!(this.state.updateInterface|=0)&&this.state.replayer&&this.state.durationLoaded){let p=this.parent;setTimeout(()=>(p.ui.ready=!0)&&p.updateInterface());this.state.updateInterface=!0}},ChangeYouTubeLayout:function(){if(!(this.state.menuList|=0)){let e=$('#watch8-secondary-actions'),eMenu=e&&e.querySelector('ul');if(eMenu){let eC=e.children,eLi=document.createElement('li');eC[1].classList.remove('yt-uix-button','yt-uix-button-opacity','yt-uix-button-has-icon','no-icon-markup','yt-uix-tooltip');eC[1].classList.add('has-icon','yt-ui-menu-item','yt-uix-menu-close-on-select');eLi.appendChild(eC[1]);eMenu.insertBefore(eLi,eMenu.children[0]);this.state.menuList=!0}}},ChangeQuanlity:function(){if(!(this.state.playerQuality|=0)){let p=this.parent.player;if(p){p.setPlaybackQuality(p.getMaxPlaybackQuality());this.state.playerQuality=p.getPlaybackQuality()==p.getMaxPlaybackQuality()}}},LoadInfoAndRun:function(){if(!(this.state.durationLoading|=0)){let p=this.parent;p.IndexedDB.init();this.state.durationLoading=!0;this.state.durationLoaded=!1;p.IndexedDB.getInfoByVideoID(this.state.curVideoID,(info)=>{if(info){p.duration.from=info.from;p.duration.to=info.to;p.toggle(info.curMode)}this.state.durationLoading=this.state.durationLoaded=p.IndexedDB.isReqOpen})}},main:function(){let p=this.parent;if(!this.changing&&p.isVideoChanged()){let newVideoID=p.player.getVideoData().video_id;if(newVideoID){if(!this.state){if(p.videoID)p.unload.main();this.state={};this.state.curVideoID=newVideoID;this.main()}else{let result=!0;this.changing=!0;for(let x in this)this[x].constructor==Function&&this[x]();this.changing=!1;for(let x in this.state){if(!this.state[x]){result=!1;break}}if(result){p.videoID=newVideoID;delete this.state}else setTimeout(()=>this.main())}}}}},isVideoChanged:function(){return this.videoID!=this.player.getVideoData().video_id},start:function(){this.IndexedDB.parent=this.unload.parent=this.init.parent=this;let evt='addEventListener',f=()=>{let p=this.player=$('#movie_player'),v=this.video=p&&p.querySelector('video');if(p&&v){let reloadTimer=()=>!this.isVideoChanged()&&this.toggle(this.curMode);let stopTimer=()=>this.rmTimer();v[evt]('play',reloadTimer);v[evt]('seeked',reloadTimer);v[evt]('ratechange',reloadTimer);v[evt]('pause',stopTimer);v[evt]('suspend',stopTimer);v[evt]('waiting',stopTimer);v[evt]('durationchange',()=>this.init.main())}else setTimeout(f)};f();window[evt]('beforeunload',()=>this.unload.main())}}).start();";
	document.head.appendChild(script);
}
