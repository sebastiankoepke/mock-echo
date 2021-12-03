"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var Channel = (function () {
    function Channel() {
        this.events = {};
    }
    Channel.prototype.listen = function (eventName, fn) {
        this.events[eventName] = fn;
        return this;
    };
    Channel.prototype.stopListening = function (eventName) {
        delete this.events[eventName];
        return this;
    };
    Channel.prototype.broadcast = function (eventName, event) {
        if (typeof this.events[eventName] === 'undefined') {
            console.error("Channel didn't listen to event: " + eventName);
            return;
        }
        this.events[eventName](event);
    };
    Channel.prototype.eventExist = function (eventName) {
        return typeof this.events[eventName] !== 'undefined';
    };
    Channel.prototype.clientEventExist = function (eventName) {
        return typeof this.clientEvents["client-" + eventName] !== 'undefined';
    };
    return Channel;
}());
var PrivateChannel = (function (_super) {
    __extends(PrivateChannel, _super);
    function PrivateChannel() {
        var _this = _super.call(this) || this;
        _this.clientEvents = [];
        _this.notificationFn = null;
        return _this;
    }
    PrivateChannel.prototype.whisper = function (eventName, event) {
        if (typeof this.clientEvents["client-" + eventName] === 'undefined') {
            console.error("Channel didn't listen to client event: " + eventName);
            return;
        }
        this.clientEvents["client-" + eventName](event);
    };
    PrivateChannel.prototype.listenForWhisper = function (eventName, whisperFn) {
        this.clientEvents["client-" + eventName] = whisperFn;
        return this;
    };
    PrivateChannel.prototype.notification = function (notificationFn) {
        this.notificationFn = notificationFn;
        return this;
    };
    PrivateChannel.prototype.notify = function (notifiable) {
        this.notificationFn(notifiable);
    };
    return PrivateChannel;
}(Channel));
var PresenceChannel = (function (_super) {
    __extends(PresenceChannel, _super);
    function PresenceChannel() {
        var _this = _super.call(this) || this;
        _this.users = [];
        _this.hereFn = null;
        _this.joiningFn = null;
        _this.leavingFn = null;
        return _this;
    }
    PresenceChannel.prototype.iJoin = function (user) {
        if (user == null) {
            console.error('user is null!');
            return;
        }
        user.subId = Math.floor(Math.random() * 1000);
        this.users.push(user);
        var broadcastUsers = this.getBroadcastUsers();
        this.hereFn(broadcastUsers);
    };
    PresenceChannel.prototype.userJoin = function (user) {
        if (user == null) {
            console.error('user is null!');
            return;
        }
        var subId = Math.floor(Math.random() * 1000);
        user.subId = subId;
        this.users.push(user);
        var broadcastUser = this.getBroadcastUser(user);
        this.joiningFn(broadcastUser);
        return subId;
    };
    PresenceChannel.prototype.userLeave = function (subId) {
        if (subId == null) {
            console.error('subId is null!');
            return;
        }
        var leavingUser = this.findUserBySubId(subId);
        if (leavingUser == null) {
            console.error("Cannot find user by subId " + subId + " !");
            return;
        }
        var broadcastUser = this.getBroadcastUser(leavingUser);
        this.leavingFn(broadcastUser);
    };
    PresenceChannel.prototype.findUserBySubId = function (subId) {
        var targetUser = null;
        for (var i = this.users.length - 1; i >= 0; i--) {
            var user = this.users[i];
            if (user.subId === subId) {
                targetUser = user;
                this.users.splice(i, 1);
            }
        }
        return targetUser;
    };
    PresenceChannel.prototype.getBroadcastUser = function (user) {
        var broadcastUser = _.cloneDeep(user);
        delete broadcastUser['subId'];
        return broadcastUser;
    };
    PresenceChannel.prototype.getBroadcastUsers = function () {
        var broadcastUsers = [];
        for (var i = 0; i < this.users.length; i++) {
            broadcastUsers.push(this.getBroadcastUser(this.users[i]));
        }
        return broadcastUsers;
    };
    PresenceChannel.prototype.here = function (fn) {
        this.hereFn = fn;
        return this;
    };
    PresenceChannel.prototype.joining = function (fn) {
        this.joiningFn = fn;
        return this;
    };
    PresenceChannel.prototype.leaving = function (fn) {
        this.leavingFn = fn;
        return this;
    };
    PresenceChannel.prototype.notification = function (notificationFn) {
        console.error("Presence channel doesn't support notification");
        return this;
    };
    return PresenceChannel;
}(PrivateChannel));
var MockEcho = (function () {
    function MockEcho() {
        this.channels = {};
    }
    MockEcho.prototype.private = function (channelName) {
        return this.listenChannelByFullName("private-" + channelName);
    };
    MockEcho.prototype.channel = function (channelName) {
        return this.listenChannelByFullName(channelName);
    };
    MockEcho.prototype.join = function (channelName) {
        var presenceChannel = this.listenChannelByFullName("presence-" + channelName);
        return presenceChannel;
    };
    MockEcho.prototype.leave = function (channelName) {
        if (typeof this.channels[channelName] !== 'undefined') {
            delete this.channels[channelName];
        }
        if (typeof this.channels["private-" + channelName] !== 'undefined') {
            delete this.channels["private-" + channelName];
        }
        if (typeof this.channels["presence-" + channelName] !== 'undefined') {
            delete this.channels["presence-" + channelName];
        }
        return this;
    };
    MockEcho.prototype.listenChannelByFullName = function (fullName) {
        if (typeof this.channels[fullName] === 'undefined') {
            if (fullName.startsWith('presence-')) {
                this.channels[fullName] = new PresenceChannel();
            }
            else if (fullName.startsWith('private-')) {
                this.channels[fullName] = new PrivateChannel();
            }
            else {
                this.channels[fullName] = new Channel();
            }
        }
        return this.channels[fullName];
    };
    MockEcho.prototype.getPrivateChannel = function (channelName) {
        return this.getChannelByFullName("private-" + channelName);
    };
    MockEcho.prototype.getChannel = function (channelName) {
        return this.getChannelByFullName(channelName);
    };
    MockEcho.prototype.getPresenceChannel = function (channelName) {
        return this.getChannelByFullName("presence-" + channelName);
    };
    MockEcho.prototype.getChannelByFullName = function (fullName) {
        if (typeof this.channels[fullName] === 'undefined') {
            console.error("Echo doesn't have channel: " + fullName);
            return;
        }
        return this.channels[fullName];
    };
    MockEcho.prototype.channelExistByFullName = function (fullName) {
        return typeof this.channels[fullName] !== 'undefined';
    };
    MockEcho.prototype.privateChannelExist = function (channelName) {
        return this.channelExistByFullName("private-" + channelName);
    };
    MockEcho.prototype.channelExist = function (channelName) {
        return this.channelExistByFullName(channelName);
    };
    MockEcho.prototype.presenceChannelExist = function (channelName) {
        return this.channelExistByFullName("presence-" + channelName);
    };
    return MockEcho;
}());
exports.default = MockEcho;
