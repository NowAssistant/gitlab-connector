const api = require('./api');

const PAGE_SIZE = 3;

module.exports = async function (activity) {
    try {
        api.initialize(activity); 
      
        var action = "firstpage";

        // items: search
        let page = parseInt(activity.Request.Query.page) || 1;
        let pageSize = parseInt(activity.Request.Query.pageSize) || PAGE_SIZE;

        // nextpage request
        if ((activity.Request.Data && activity.Request.Data.args && activity.Request.Data.args.atAgentAction == "nextpage")) {
            page = parseInt(activity.Request.Data.args._page) || 2;
            pageSize = parseInt(activity.Request.Data.args._pageSize) || PAGE_SIZE;
            action = "nextpage";
        }

        // Ensure page number and page size values remain constrained / valid
        if (page < 0) page = 1;
        if (pageSize < 1 || pageSize > 99) pageSize = PAGE_SIZE;

        // Send query and capture response
        const response = await api('/issues');

        if ((!response || response.statusCode != 200)) {
            // Error has occurred, react accordingly
            activity.Response.ErrorCode = response.statusCode || 500;
            activity.Response.Data = { ErrorText: "request failed" };           
        } else {
            // Capture response items                                  
            let items = response.body;

            // Update response data 
            activity.Response.Data._action = action;
            activity.Response.Data._page = page;
            activity.Response.Data._pageSize = pageSize;
            activity.Response.Data._total = items.length;

            activity.Response.Data.items = [];

            if (items.length > 0) {
                startItem = Math.max(page - 1, 0) * pageSize;
                endItem = startItem + pageSize;

                if (endItem > items.length) endItem = items.length;

                for (let i = startItem; i < endItem; i++) {
                    activity.Response.Data.items.push(items[i]);
                }
            }
        }
    } catch (error) {
        // return error response
        var m = error.message;    
        if (error.stack) m = m + ": " + error.stack;

        activity.Response.ErrorCode = (error.response && error.response.statusCode) || 500;
        activity.Response.Data = { ErrorText: m };
    }

};