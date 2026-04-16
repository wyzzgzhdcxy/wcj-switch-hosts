export namespace hosts {
	
	export class FindSplitter {
	    start: number;
	    end: number;
	    before: string;
	    match: string;
	    after: string;
	    replace?: string;
	
	    static createFrom(source: any = {}) {
	        return new FindSplitter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.start = source["start"];
	        this.end = source["end"];
	        this.before = source["before"];
	        this.match = source["match"];
	        this.after = source["after"];
	        this.replace = source["replace"];
	    }
	}
	export class FindPosition {
	    start: number;
	    end: number;
	    line: number;
	    line_pos: number;
	    end_line: number;
	    end_line_pos: number;
	    before: string;
	    match: string;
	    after: string;
	
	    static createFrom(source: any = {}) {
	        return new FindPosition(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.start = source["start"];
	        this.end = source["end"];
	        this.line = source["line"];
	        this.line_pos = source["line_pos"];
	        this.end_line = source["end_line"];
	        this.end_line_pos = source["end_line_pos"];
	        this.before = source["before"];
	        this.match = source["match"];
	        this.after = source["after"];
	    }
	}
	export class FindItem {
	    item_id: string;
	    item_title: string;
	    item_type: string;
	    positions: FindPosition[];
	    splitters: FindSplitter[];
	
	    static createFrom(source: any = {}) {
	        return new FindItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.item_id = source["item_id"];
	        this.item_title = source["item_title"];
	        this.item_type = source["item_type"];
	        this.positions = this.convertValues(source["positions"], FindPosition);
	        this.splitters = this.convertValues(source["splitters"], FindSplitter);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class TrashcanObject {
	    id: string;
	    data?: HostsListObject;
	    add_time_ms: number;
	    parent_id?: string;
	
	    static createFrom(source: any = {}) {
	        return new TrashcanObject(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.data = this.convertValues(source["data"], HostsListObject);
	        this.add_time_ms = source["add_time_ms"];
	        this.parent_id = source["parent_id"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class HostsListObject {
	    id: string;
	    title?: string;
	    on?: boolean;
	    type?: string;
	    url?: string;
	    last_refresh?: string;
	    last_refresh_ms?: number;
	    refresh_interval?: number;
	    include?: string[];
	    folder_mode?: number;
	    folder_open?: boolean;
	    children?: HostsListObject[];
	    is_sys?: boolean;
	    content?: string;
	    can_select?: boolean;
	    can_drag?: boolean;
	    can_drop_before?: boolean;
	    can_drop_in?: boolean;
	    can_drop_after?: boolean;
	    is_collapsed?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new HostsListObject(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.on = source["on"];
	        this.type = source["type"];
	        this.url = source["url"];
	        this.last_refresh = source["last_refresh"];
	        this.last_refresh_ms = source["last_refresh_ms"];
	        this.refresh_interval = source["refresh_interval"];
	        this.include = source["include"];
	        this.folder_mode = source["folder_mode"];
	        this.folder_open = source["folder_open"];
	        this.children = this.convertValues(source["children"], HostsListObject);
	        this.is_sys = source["is_sys"];
	        this.content = source["content"];
	        this.can_select = source["can_select"];
	        this.can_drag = source["can_drag"];
	        this.can_drop_before = source["can_drop_before"];
	        this.can_drop_in = source["can_drop_in"];
	        this.can_drop_after = source["can_drop_after"];
	        this.is_collapsed = source["is_collapsed"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class HostsBasicData {
	    list: HostsListObject[];
	    trashcan: TrashcanObject[];
	    version: number[];
	
	    static createFrom(source: any = {}) {
	        return new HostsBasicData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.list = this.convertValues(source["list"], HostsListObject);
	        this.trashcan = this.convertValues(source["trashcan"], TrashcanObject);
	        this.version = source["version"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class OperationResult {
	    success: boolean;
	    message?: string;
	    code?: string;
	    data?: any;
	
	    static createFrom(source: any = {}) {
	        return new OperationResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.code = source["code"];
	        this.data = source["data"];
	    }
	}

}

