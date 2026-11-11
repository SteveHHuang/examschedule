// Format presentation only; preserve source times and calendar event IDs.
function formatExamTime(value) {
    const raw = String(value ?? "");
    const match = raw.trim().match(/^(\d{1,2}):?(\d{2})\s*[-–—]\s*(\d{1,2}):?(\d{2})$/);
    if (!match) return raw;
    const [, h1, m1, h2, m2] = match;
    if (+h1 > 23 || +h2 > 23 || +m1 > 59 || +m2 > 59) return raw;
    return `${h1.padStart(2, "0")}:${m1}–${h2.padStart(2, "0")}:${m2}`;
}
