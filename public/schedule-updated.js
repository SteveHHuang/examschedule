// Timetable revision time, independent of page loads, builds, or styling edits.
export function formatScheduleUpdated(value, language) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    const english = language.startsWith("en");
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Shanghai", year: "numeric",
        month: english ? "short" : "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(date).map(part => [part.type, part.value]));
    const day = english ? `${parts.month} ${parts.day} ${parts.year}`
        : `${parts.year}/${parts.month}/${parts.day}`;
    return `${english ? "Last updated: " : "上次更新："}${day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

const line = document.querySelector("#line-last-updated");
if (line) {
    fetch("/schedule-updated.json")
        .then(response => {
            if (!response.ok) throw new Error("Unable to load timetable revision time");
            return response.json();
        })
        .then(revisions => {
            const render = () => {
                line.textContent = formatScheduleUpdated(revisions[line.dataset.schedule], document.documentElement.lang);
                line.hidden = !line.textContent;
            };
            render();
            new MutationObserver(render).observe(document.documentElement, {
                attributes: true, attributeFilter: ["lang"],
            });
        })
        .catch(error => console.warn(error.message));
}
