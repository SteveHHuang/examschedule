// Local diagnostics only: no names, rosters, or timing data are uploaded.
window.ScheduleLoader = {
    status: "loading",
    async load(url) {
        const form = document.querySelector("form");
        form.addEventListener("submit", event => {
            event.preventDefault();
            if (this.status !== "ready") event.stopImmediatePropagation();
        });
        performance.mark("schedule-download-start");
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        performance.mark("schedule-download-end");
        const data = JSON.parse(text);
        performance.mark("schedule-parse-end");
        return data;
    },
    ready() {
        this.status = "ready";
        document.querySelector("form button[type='submit']").disabled = false;
        performance.mark("schedule-ready");
        const duration = (name, start, end) => performance.measure(name, start, end).duration;
        window.scheduleLoadTimings = {
            downloadMs: duration("schedule-download", "schedule-download-start", "schedule-download-end"),
            parseMs: duration("schedule-parse", "schedule-download-end", "schedule-parse-end"),
            setupMs: duration("schedule-setup", "schedule-parse-end", "schedule-ready"),
            totalMs: duration("schedule-total", "schedule-download-start", "schedule-ready"),
            readyAfterNavigationMs: performance.now(),
        };
        console.debug("Schedule ready (milliseconds): " + JSON.stringify(window.scheduleLoadTimings));
    },
    failed() {
        this.status = "error";
        document.querySelector("form button[type='submit']").disabled = true;
    },
};
