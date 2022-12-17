// navigator
// ua -> platform/oscpu
let custPlatformGetter = function (){
    let ua = navigator.userAgent.toLocaleLowerCase();
    if(ua.indexOf('win')>0){
        return 'Win32';
    }
    if(ua.indexOf('mac')>0){
        return 'MacIntel';
    }
    return 'Win32';
};
if(Object.defineProperty){
    Object.defineProperty(navigator, 'platform', {
        get: custPlatformGetter
    });
}else if(Object.prototype.__defineGetter__){
    navigator.__defineGetter__("platform", custPlatformGetter);
}


