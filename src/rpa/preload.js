// navigator
// ua -> platform/oscpu
Object.defineProperty(navigator, 'platform', {
	get: () => {
        let ua = navigator.userAgent.toLocaleLowerCase();
        if(ua.indexOf('win')>0){
            return 'Win32';
        }
        if(ua.indexOf('mac')>0){
            return 'MacIntel';
        }
        return 'Win32';
    }
});