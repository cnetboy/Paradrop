"use strict";angular.module("localApp",["ngAnimate","ngAria","ngCookies","ngMessages","ngResource","ngRoute","ngSanitize","ngTouch","ui.bootstrap"]).config(["$routeProvider",function(a){a.when("/",{templateUrl:"views/main.html",controller:"MainCtrl as mainCtrl"}).when("/settings",{templateUrl:"views/settings.html",controller:"SettingsCtrl as settingCtrl"}).when("/status",{templateUrl:"views/status.html",controller:"StatusCtrl as statusCtrl"}).otherwise({redirectTo:"/"})}]),angular.module("localApp").directive("convertToInt",function(){return{require:"ngModel",link:function(a,b,c,d){d.$parsers.push(function(a){return parseInt(a,10)}),d.$formatters.push(function(a){return""+a})}}}),angular.module("localApp").directive("ipaddress",function(){return{require:"ngModel",link:function(a,b,c,d){d.$validators.ipaddress=function(a,b){if(d.$isEmpty(a))return!1;var c;if(null!==(c=b.match(/^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/))){var e;for(e=1;e<5;e++){var f=parseInt(c[e]);if(f>255)return!1}return!0}return!1}}}}),angular.module("localApp").directive("netmask",function(){return{require:"ngModel",link:function(a,b,c,d){d.$validators.netmask=function(a,b){if(d.$isEmpty(a))return!1;var c;if(null!==(c=b.match(/^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/))){var e,f=["255","254","252","248","240","224","192","128","0"],g="255";for(e=1;e<5;e++)if("255"===g&&f.indexOf(c[e])!==-1)g=c[e];else if("0"!==c[e])return!1;return!0}return!1}}}}),angular.module("localApp").controller("SettingsCtrl",["$http","$filter","RouterService",function(a,b,c){var d=this;d.wifiChannels=[1,2,3,4,5,6,7,8,9,10,11],d.protocols=["dhcp","static"],d.modes=["ap"],d.encryptions=["none","psk2"],d.encryptionChanged=function(a){"none"===a.encryption&&(a.key=null)},d.createAp=function(){d.aps||(d.aps=[]),d.aps.push({ifname:"wlan-pd",device:d.wifi[0].interface,ssid:"paradrop",mode:d.modes[0],network:"lan",encryption:d.encryptions[0],key:null})},d.deleteAp=function(){var a=[];angular.forEach(d.aps,function(b){b.isDeleted||a.push(b)}),d.aps=a},d.apply=function(a){var b={};b.lan={ipaddr:d.lanIpaddress,netmask:d.lanNetmask,proto:d.lanProtocol,interfaces:[],dhcp:{leasetime:d.lanDhcpLeaseTime,limit:d.lanDhcpLimit,start:d.lanDhcpStart}},d.lanEth1&&b.lan.interfaces.push("eth1"),d.lanEth2&&b.lan.interfaces.push("eth2"),b.wan={interface:d.wanInterface,proto:d.wanProtocol},b.wifi=d.wifi,d.aps&&(b["wifi-interfaces"]=d.aps.map(function(a){var b={};return b.device=a.device,b.ssid=a.ssid,b.mode=a.mode,b.network=a.network,b.ifname=a.ifname,"none"!==a.encryption&&(b.encryption=a.encryption,b.key=a.key),b})),c.putHostConfig({config:b}).then(function(a){console.log("done")},function(a){console.log("failed")})},d.reset=function(){c.getHostConfig().then(function(a){var b=a.data;d.lanNetmask=b.lan.netmask,d.lanIpaddress=b.lan.ipaddr,d.lanProtocol=b.lan.proto,d.lanEth1=b.lan.interfaces.includes("eth1"),d.lanEth2=b.lan.interfaces.includes("eth2"),d.lanDhcpLeaseTime=b.lan.dhcp.leasetime,d.lanDhcpLimit=b.lan.dhcp.limit,d.lanDhcpStart=b.lan.dhcp.start,d.wanProtocol=b.wan.proto,d.wanInterface=b.wan.interface,d.wifi=b.wifi,d.wifiDevices=d.wifi.map(function(a){return a.interface}),d.aps=b["wifi-interfaces"]})},d.reset()}]),angular.module("localApp").controller("StatusCtrl",["$scope","$http","$interval","RouterService",function(a,b,c,d){var e=this;e.eth0=null,e.eth1=null,e.eth2=null,e.wlan0=null,e.wlan1=null,e.cpuload=0,e.totalRAM=0,e.freeRAM=0,e.totalDisk=0,e.freeDisk=0;var f=function(){d.getHostStatus().then(function(a){var b=a.data;console.log(b),e.cpuload=Math.round(b.cpu),e.totalRAM=Math.round(b.memory[0]/1048576),e.freeRAM=Math.round(b.memory[1]/1048576),e.totalDisk=Math.round(b.disks[0]/1048576),e.freeDisk=Math.round(b.disks[1]/1048576)},function(a){})},g=null,h=function(){g||(g=c(f,2e3))},i=function(){g&&(c.cancel(g),g=null)};a.$on("$destroy",function(){i()}),h();var j=function(a,b,c){if(a[c]){var d=b[c].filter(function(a){return 2===a[0]})[0],f=b[c].filter(function(a){return 17===a[0]})[0];d&&f&&(e[c]={ip:d[1],netmask:d[2],mac:f[1]})}},k=function(){d.getNetInfo().then(function(a){var b=a.data,c=b.stats,d=b.addresses;j(c,d,"eth0"),j(c,d,"eth1"),j(c,d,"eth2"),j(c,d,"wlan0"),j(c,d,"wlan1")})};k()}]),angular.module("localApp").controller("MainCtrl",["$scope","$uibModal","RouterService",function(a,b,c){var d=this;d.openLoginModal=function(a){var c=b.open({animation:!0,templateUrl:"loginModalContent.html",controller:"LoginModalCtrl as loginModalCtrl"});c.result.then(function(a){a&&(d.routerId=a.routerId,d.provisioned=a.provisioned,d.httpConnected=a.httpConnected,d.wampConnected=a.wampConnected)},function(){})},d.routerId=null,d.provisioned=!1,d.wampConnected=!1,d.httpConnected=!1,c.getProvision().then(function(a){d.routerId=a.data.pdid,d.provisioned=a.data.provisioned,d.wampConnected=a.data.wamp_connected,d.httpConnected=a.data.http_connected})}]),angular.module("localApp").controller("LoginModalCtrl",["$scope","$uibModalInstance","RouterService",function(a,b,c){var d=this;d.routerId=null,d.routerToken=null,d.wampPassword=null,d.login=function(){c.postProvision(d.routerId,d.routerToken,d.wampPassword).then(function(a){var c={};c.routerId=d.routerId,c.provisioned=a.data.provisioned,c.httpConnected=a.data.http_connected,c.wampConnected=a.data.wamp_connected,b.close(c)},function(a){b.close(null)})},d.cancel=function(){d.routerId=null,d.routerToken=null,d.wampPassword=null,b.dismiss("cancel")}}]),angular.module("localApp").factory("RouterService",["$http","UrlService",function(a,b){var c={};return c.getHostStatus=function(){return a.get(b.url+"v1/hoststatus")},c.getNetInfo=function(){return a.get(b.url+"v1/netinfo")},c.getHostConfig=function(){return a.get(b.url+"v1/hostconfig")},c.putHostConfig=function(c){return a.put(b.url+"v1/hostconfig",c)},c.getProvision=function(){return a.get(b.url+"v1/provision")},c.postProvision=function(c,d,e){return a.post(b.url+"v1/provision",{pdid:c,apitoken:d,wamppassword:e})},c}]),angular.module("localApp").factory("UrlService",["$location",function(a){return{url:a.protocol()+"://"+a.host()+":14321/"}}]),angular.module("localApp").run(["$templateCache",function(a){a.put("views/main.html",'<h2>Login to the ParaDrop backend</h2> <button ng-click="mainCtrl.openLoginModal()" class="btn btn-primary" type="button">Login</button> <script type="text/ng-template" id="loginModalContent.html"><div class="modal-header">\n      <h3 class="modal-title">Login to ParaDrop</h3>\n  </div>\n  <div class="modal-body">\n    <form class="form-horizontal" role="form">\n      <div class="form-group">\n        <label class="col-sm-2 control-label"\n               for="routerId">Router ID</label>\n        <div class="col-sm-10">\n            <input type="text" class="form-control" \n                   id="routerId" placeholder="Router ID" ng-model="loginModalCtrl.routerId"/>\n        </div>\n      </div>\n      <div class="form-group">\n        <label class="col-sm-2 control-label"\n               for="routerToken" >API Token</label>\n        <div class="col-sm-10">\n            <input type="token" class="form-control"\n                   id="routerToken" placeholder="Token" ng-model="loginModalCtrl.routerToken"/>\n        </div>\n      </div>\n      <div class="form-group">\n        <label class="col-sm-2 control-label"\n               for="wampPassword" >Password</label>\n        <div class="col-sm-10">\n            <input type="password" class="form-control"\n                   id="wampPassword" placeholder="Password" ng-model="loginModalCtrl.wampPassword"/>\n        </div>\n      </div>\n    </form>\n  </div>\n  <div class="modal-footer">\n    <button class="btn btn-primary" type="button" ng-click="loginModalCtrl.login()">Login</button>\n    <button class="btn btn-warning" type="button" ng-click="loginModalCtrl.cancel()">Cancel</button>\n  </div></script> <hr> <h2>Status</h2> <pre>This router is <span ng-if="!mainCtrl.provisioned">not </span>provisioned.\n<span ng-if="mainCtrl.provisioned">The HTTP connection is <span ng-if="!mainCtrl.httpConnected">not </span>ready.<span ng-if="!mainCtrl.httpConnected"> Please check the api token</span>\nThe WAMP connection is <span ng-if="!mainCtrl.wampConnected">not </span>ready.<span ng-if="!mainCtrl.httpConnected"> Please check the password</span></span>\n</pre> <h3>ParaDrop informations.</h3> <pre><span ng-if="!mainCtrl.provisioned">Please login first!</span><span ng-if="mainCtrl.provisioned">Router ID is {{mainCtrl.routerId}}</span></pre>'),a.put("views/settings.html",'<div id="paradrop-settings-container" class="container"> <h3>LAN</h3> <div class="container settingbox"> <form novalidate name="lanAddressForm"> <div class="form-group row has-feedback" ng-class="{&quot;has-success&quot;: lanAddressForm.ipaddress.$valid,\n                      &quot;has-error&quot;: lanAddressForm.ipaddress.$invalid}"> <label class="col-xs-2 form-label" for="ipaddressInput">IP address:</label> <div class="col-xs-5"> <input ng-model="settingCtrl.lanIpaddress" ipaddress class="form-control input-sm" name="ipaddress"> </div> </div> <div class="form-group row" ng-class="{&quot;has-success&quot;: lanAddressForm.netmask.$valid,\n                      &quot;has-error&quot;: lanAddressForm.netmask.$invalid}"> <label class="col-xs-2 form-label" for="netmask">Netmask:</label> <div class="col-xs-5"> <input ng-model="settingCtrl.lanNetmask" netmask class="form-control input-sm" name="netmask"> </div> </div> <div class="form-group row"> <label class="col-xs-2 form-label">Interfaces:</label> <div class="col-xs-8"> <label class="checkbox-inline"><input type="checkbox" ng-model="settingCtrl.lanEth1"> eth1</label> <label class="checkbox-inline"><input type="checkbox" ng-model="settingCtrl.lanEth2"> eth2</label> </div> </div> <div class="form-group row"> <label class="col-xs-2 form-label">Protocol:</label> <div class="col-xs-5"> <select class="form-control input-sm" ng-model="settingCtrl.lanProtocol" ng-options="protocol for protocol in settingCtrl.protocols"> </select> </div> </div> </form> <div class="row"> <h5 class="col-xs-2">DHCP</h5> <div class="col-xs-10" style="border-left-style:outset"> <form name="dhcpForm"> <div class="form-group row"> <label class="col-xs-3 form-label">Lease time:</label> <div class="col-xs-3"> <input ng-model="settingCtrl.lanDhcpLeaseTime" class="form-control input-sm"> </div> </div> <div class="form-group row"> <label class="col-xs-3 form-label">Limit:</label> <div class="col-xs-3"> <input ng-model="settingCtrl.lanDhcpLimit" class="form-control input-sm" converttoint> </div> </div> <div class="form-group row"> <label class="col-xs-3 form-label">Start:</label> <div class="col-xs-3"> <input ng-model="settingCtrl.lanDhcpStart" class="form-control input-sm" converttoint> </div> </div> </form> </div> </div> </div> <h3>WAN</h3> <div class="container settingbox"> <form novalidate name="wanForm"> <div class="form-group row"> <label class="col-xs-2 form-label">Interface:</label> <div class="col-xs-5"> <input ng-model="settingCtrl.wanInterface" class="form-control input-sm" disabled> </div> </div> <div class="form-group row"> <label class="col-xs-2">Protocol:</label> <div class="col-xs-5"> <select class="form-control input-sm" ng-model="settingCtrl.wanProtocol" ng-options="protocol for protocol in settingCtrl.protocols"> </select> </div> </div> </form> </div> <h3>Wi-Fi Devices</h3> <div class="container settingbox"> <table class="table table-hover"> <thead> <tr> <th>Interface</th> <th>Channel</th> </tr> </thead> <tbody> <tr ng-repeat="wifi in settingCtrl.wifi"> <td class="col-xs-2">{{wifi.interface}}</td> <td> <select class="form-control input-sm" converttoint ng-model="wifi.channel" ng-options="channel for channel in settingCtrl.wifiChannels"> </select> </td> </tr> </tbody> </table> </div> <h3>Access Points <a class="btn btn-default" ng-click="settingCtrl.createAp()"><span class="glyphicon glyphicon-plus"></span> New AP </a> <a class="btn btn-default" ng-click="settingCtrl.deleteAp()"><span class="glyphicon glyphicon-minus"></span> Delete AP </a> </h3> <div class="container settingbox"> <table class="table table-hover"> <thead> <tr> <th>#</th> <th class="col-xs-2">Name</th> <th>Device</th> <th class="col-xs-2">SSID</th> <th>Mode</th> <th class="col-xs-1">Network</th> <th>Encryption</th> <th class="col-xs-2">Key</th> </tr> </thead> <tbody> <tr ng-repeat="ap in settingCtrl.aps"> <td><input type="checkbox" ng-model="ap.isDeleted"></td> <td> <input type="text" class="form-control input-sm" ng-model="ap.ifname">  </td> <td> <select ng-model="ap.device" ng-options="device for device in settingCtrl.wifiDevices"> </select> </td> <td> <input type="text" class="form-control input-sm" ng-model="ap.ssid">  </td> <td> <select ng-model="ap.mode" ng-options="mode for mode in settingCtrl.modes"> </select> </td> <td> <input type="text" class="form-control input-sm" ng-model="ap.network" disabled>  </td> <td> <select ng-model="ap.encryption" ng-options="encryption for encryption in settingCtrl.encryptions" ng-change="settingCtrl.encryptionChanged(ap)"> </select> </td> <td> <input type="text" class="form-control input-sm" ng-model="ap.key" ng-disabled="ap.encryption===\'none\'">  </td> </tr> </tbody> </table> </div> </div> <br> <div class="container"> <button ng-click="settingCtrl.reset()" class="btn btn-warning" type="button">Reset</button> <button ng-click="settingCtrl.apply()" class="btn btn-primary" type="button">Apply</button> </div> <br>'),a.put("views/status.html",'<h3>Network Status</h3> <div class="container"> <h4>Ethernet</h4> <pre ng-if="!statusCtrl.eth0 && !statusCtrl.eth1 && !statusCtrl.eth2">\nAll interfaces are down\n</pre> <pre ng-if="statusCtrl.eth0">\neth0  inet addr:{{statusCtrl.eth0.ip}}, Mask:{{statusCtrl.eth0.netmask}}, HW addr:{{statusCtrl.eth0.mac}}\n</pre> <pre ng-if="statusCtrl.eth1">\neth1  inet addr:{{statusCtrl.eth1.ip}}, Mask:{{statusCtrl.eth1.netmask}}, HW addr:{{statusCtrl.eth1.mac}}\n</pre> <pre ng-if="statusCtrl.eth2">\neth2  inet addr:{{statusCtrl.eth2.ip}}, Mask:{{statusCtrl.eth2.netmask}}, HW addr:{{statusCtrl.eth2.mac}}\n</pre> </div> <div class="container"> <h4>Wi-Fi</h4> <pre ng-if="!statusCtrl.wlan0 && !statusCtrl.wlan1">\nBoth interfaces are down\n</pre> <pre ng-if="statusCtrl.wlan0">\nwlan0  inet addr:{{statusCtrl.wlan0.ip}}, Mask:{{statusCtrl.wlan0.netmask}}, HW addr:{{statusCtrl.wlan0.mac}}\n</pre> <pre ng-if="statusCtrl.wlan1">\nwlan1  inet addr:{{statusCtrl.wlan1.ip}}, Mask:{{statusCtrl.wlan1.netmask}}, HW addr:{{statusCtrl.wlan1.mac}}\n</pre> </div> <h3>Computer Status</h3> <div class="container"> <pre>\nCPU load      : {{statusCtrl.cpuload}}%\nMemory (MB)   : {{statusCtrl.freeRAM}} / {{statusCtrl.totalRAM}}\nDisk Usage(MB): {{statusCtrl.freeDisk}} / {{statusCtrl.totalDisk}}</pre> </div>')}]);