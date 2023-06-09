/*
 * 2023 Jon Rabe, jonrabe@jonr.net
 */



const api_root =  "src/php/main.php/api/";
const fetch_cmd = "/fetch";


function makeOutline(){
    let wrapper = document.createElement("div");
    wrapper.className = "content";
    document.body.append(wrapper);

    return {
        wrapper: wrapper,
        entries: [],

        addEntries: function(outline) {
            for (entry of outline.index){
                let outline_entry = _makeEntry(entry);
                let title = outline_entry.node.getElementsByClassName("title")[0];
                title.onclick = () => {
                    outline_entry.toggle_binding();
                };

                this.entries.push(outline_entry);
            }
        },

        sortEntries: function() {
            this.entries.sort(
                (a,b) => b.timestamp - a.timestamp
            );
        },

        pushEntries: function () {
            this.wrapper.replaceChildren(
                ...this.entries.map(e => e.node)
            );
        }
    };
}


function _makeEntry(entry){
    let wrapper = _makeEntryWrapper(entry),
        tag_filters = _makeTagWrappers(entry, wrapper);

    return {
        node: wrapper,
        tags: entry.tags,
        url: entry.url,
        endpoint:  entry.endpoint,
        timestamp: _parseDateString(entry.date),
        bound: false,
        visible: true,
        tag_filters: tag_filters,
        date_filter: true,

        toggle_binding: function(){
            if (this.bound) {
                let content = this.node.getElementsByClassName("content")[0];
                content.remove();
                this.bound = false;
            }
            else {
                _bindDocument(this.url, this.endpoint, this.node);
                this.bound = true;
            }
        },

        filter: function(mode){
            let _filter = (mode=="&") ?
                (a, b)=>a && b :
                (a, b)=>a || b ;

            let visible = (mode=="&");
            for (item in this.tag_filters){
                visible = _filter(
                    visible,
                    this.tag_filters[item]
                );
            }

            visible &= this.date_filter;

            this.node.style.display = visible ?
                "block" : "none";

            this.visible = visible;
        }
    };
}


function _makeTagWrappers(entry, wrapper){
    let filters = {};

    for (_tag of entry.tags){
        let tag = document.createElement("span"),
            taglist = wrapper.getElementsByClassName("taglist")[0];

        tag.className = "tag";
        tag.innerText = _tag;
        taglist.append(tag);
        filters[_tag] = true;
    }    

    return filters;
}


function _makeEntryWrapper(entry){
    let wrapper = document.createElement("div"),
        title = document.createElement("div"),
        heading_wrapper = document.createElement("div"),
        heading = document.createElement("h2"),
        date = document.createElement("div"),
        taglist = document.createElement("span");

    wrapper.className = "content-wrapper";
    title.className = "title";
    heading_wrapper.className = "heading-wrapper";
    heading.className = "heading";
    date.className = "date";
    taglist.className = "taglist";

    heading.innerText = entry.title;
    date.innerText = _parseDateString(
        entry.date
    ).toDateString();

    heading_wrapper.append(heading);
    heading_wrapper.append(taglist);
    title.append(date);
    title.append(heading_wrapper);
    wrapper.append(title);    

    return wrapper;
}


function _bindDocument(url, endpoint, entry_wrapper){
    button = document.createElement("button");
    button.innerText = "open in new page";
    button.onclick = () => {
        open(url);
    };

    let api_url = api_root + endpoint + fetch_cmd;

    request(api_url, "GET", {
        response_type: "document",
        data: {
            "path": url
        }
    }).then(
        (doc) => {
            let content = doc.getElementById("content"),
                title = doc.getElementsByClassName("title")[0],
                tags = doc.getElementsByClassName("tags")[0];

            content.prepend(button);
            tags.remove();
            title.remove();

            entry_wrapper.append(content);
            MathJax.Hub.Queue(
                ["resetEquationNumbers", MathJax.InputJax.TeX],
                ["PreProcess", MathJax.Hub],
                ["Reprocess", MathJax.Hub]
            );
        }
    );
}


function _parseDateString(datestr){
    return new Date(
        datestr.split(" ").filter(
            (e) => !([
                "Sun", "Mon", "Tue",
                "Wed", "Thu", "Fri",
                "Sat", "Sun", "Date:"
            ].includes(e))
        ).join("T")+":00"
    );
}
