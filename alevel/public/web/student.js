import { expandCalendarSessions, foldIcsLine, safeUid } from './calendar-utils.js';
import { getSessionLocations } from './session-locations.js';
// Original examschedule page behavior, adapted for local A Level data.
const $ = window.jQuery;

    // ---- i18n (language switch) ----
    const LANG_KEY = "alevel-examschedule.lang";
    let lang = localStorage.getItem(LANG_KEY) || "zh"; // zh | en

    const i18n = {
        zh: {
            title: "BRS A Level考试时刻查询系统",
            updated: "已经更新2026年10-11月考试，请同学们查收",
            permLink: "本网站的永久链接是：https://brsexam.approacher.org/alevel, 若您目前在使用临时链接，请保存收藏以免丢失",
            findHint: "如果查不到，请在当季考试时间及学生信息表中查询",
            studentPlaceholder: "请输入学生全名",
            submit: "查找考试信息",
            showOthers: "显示考试其他学生",
            dlIcs: "下载 Apple 日历 (.ics)",
            dlNeedSearch: "先查询考试信息后再下载",
            dlReady: "下载并导入到 Apple 日历",
            errNoData: "没有查找到考试信息",
            errFetch: "无法获取考试信息",
            supervision: "中心监管：",
            formalExam: "正式考试：",
            len: "时长：",
            minutes: "分钟",
            students: "考试学生：",
            total: "共计",
            people: "人",
            location: "考试地点：",

            // footer / disclaimer
            contribHtml: `这是一个<a href="https://fsf.org/">自由软件</a>项目，由<a href="https://github.com/SteveHHuang/examschedule">@SteveHHuang</a>开发。`,
            disclaimerLabel: "反馈/免责声明",
            disclaimerText:
                "免责声明：本服务提供的考试信息仅供参考，不一定反映真实考试信息，具体请参照官方公布的考试信息。",
            contactNotice:
                "如果有任何的bug或建议，请联系开发者。",
            contactEmailLabel: "电子邮箱 Email:",
            contactDingtalkLabel: "钉钉 Dingtalk:",

            // status messages
            loading: "正在加载考试数据…",
            noResult: "没有查找到考试信息",
            didYouMean: "你是不是要找：",
            noResultHint: "可点击上方姓名直接查询；若确实查不到，请联系相关负责人确认名单。",
            noResultHintEmpty: "没有找到相近的名字；若确实查不到，请联系相关负责人确认名单。",
            loadFailTitle: "无法获取考试信息",
            loadFailHint: "请检查网络连接后重试。",
            retry: "重试",
        },
        en: {
            title: "BRS A Level Exam Schedule Lookup System",
            updated: "The October–November 2026 exam schedule has been updated. Please check your schedule.",
            permLink:
                "The permanent link to this website is https://brsexam.approacher.org/alevel. If you are using a temporary link, please bookmark the permanent link so you do not lose access.",
            findHint: "If you cannot find your schedule, please check the exam timetable and student information sheet for the current exam series.",
            studentPlaceholder: "Enter full student name",
            submit: "Find Exam Sessions",
            showOthers: "Show other students",
            dlIcs: "Download Apple Calendar (.ics)",
            dlNeedSearch: "Search first",
            dlReady: "Download and import into Apple Calendar",
            errNoData: "No exam session found",
            errFetch: "Unable to load exam sessions",
            supervision: "Supervised holding: ",
            formalExam: "Exam: ",
            len: "Duration: ",
            minutes: "minutes",
            students: "Students: ",
            total: "Total ",
            people: "",
            location: "Location: ",

            // footer / disclaimer
            contribHtml: `This is a <a href="https://fsf.org/">Free Software</a> project, developed by <a href="https://github.com/SteveHHuang/examschedule">@SteveHHuang</a>.`,
            disclaimerLabel: "Feedback / Disclaimer",
            disclaimerText:
                "Disclaimer: The exam information provided by this service is for reference only and does not necessarily reflect the actual exam information. Please refer to the official exam information for details.",
            contactNotice:
                "If you notice any bugs or have suggestions, please contact the developer.",
            contactEmailLabel: "Email:",
            contactDingtalkLabel: "Dingtalk:",

            // status messages
            loading: "Loading exam data…",
            noResult: "No exam session found",
            didYouMean: "Did you mean: ",
            noResultHint: "Tap a suggested name above to search it. If it is still missing, please contact the exam coordinator.",
            noResultHintEmpty: "No similar name found. If it is still missing, please contact the exam coordinator.",
            loadFailTitle: "Unable to load exam sessions",
            loadFailHint: "Please check your connection and try again.",
            retry: "Retry",
        },
    };

    function t(key) {
        return i18n[lang][key];
    }

    function setText(selector, text) {
        const el = document.querySelector(selector);
        if (el) el.textContent = text;
    }

    function applyLanguage() {
        document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
        setText("h1", t("title"));

        // Header lines: address them by id (order-independent, survives new lines).
        setText("#line-updated", t("updated"));
        setText("#line-permalink", t("permLink"));
        setText("#line-findhint", t("findHint"));

        const studentInput = document.querySelector("#student-name");
        if (studentInput) studentInput.placeholder = t("studentPlaceholder");

        const submitBtn = document.querySelector("form button[type='submit']");
        if (submitBtn) submitBtn.textContent = t("submit");

        const showLabel = document.querySelector("label[for='checkbox-show']");
        if (showLabel) showLabel.textContent = t("showOthers");

    const dlBtn = document.querySelector("#download-ics");
    if (dlBtn) dlBtn.textContent = t("dlIcs");

        // Footer: contribution + disclaimer block
        const contrib = document.querySelector("#contrib");
        if (contrib) {
            contrib.innerHTML = t("contribHtml");
        }

        const togLabel = document.querySelector("#toglabel");
        if (togLabel) {
            togLabel.textContent = t("disclaimerLabel");
        }

        const disclaimerText = document.querySelector("#disclaimer-text");
        if (disclaimerText) {
            disclaimerText.textContent = t("disclaimerText");
        }

        const contactNotice = document.querySelector("#contact-notice");
        if (contactNotice) {
            contactNotice.textContent = t("contactNotice");
        }

        const contactInfo = document.querySelector("#contact-info");
        if (contactInfo) {
            // Keep the mailto href, but localize the labels around it.
            const mailLink = contactInfo.querySelector('a[href^="mailto:"]');
            const dingtalkSpan = contactInfo.querySelector("span");
            contactInfo.innerHTML = "";
            contactInfo.appendChild(document.createTextNode(t("contactEmailLabel") + " "));
            if (mailLink) {
                contactInfo.appendChild(mailLink);
            }
            contactInfo.appendChild(document.createElement("br"));
            contactInfo.appendChild(document.createTextNode(t("contactDingtalkLabel") + " "));
            if (dingtalkSpan) {
                contactInfo.appendChild(dingtalkSpan);
            }
        }
    }

    // The language switch keeps the official site's static "中文 / EN" label,
    // so it does not need to be re-labelled when switching languages.
    const langToggleBtn = document.querySelector("#lang-toggle");
    if (langToggleBtn) {
        langToggleBtn.addEventListener("click", () => {
            lang = lang === "zh" ? "en" : "zh";
            localStorage.setItem(LANG_KEY, lang);
            applyLanguage();
            // re-render current result (or message) in the new language
            if (lastStudentSessions && lastStudentName) {
                renderSchedule(lastStudentName, lastStudentSessions);
            } else if (lastQueryName) {
                renderNoResult(lastQueryName, lastSuggestions || []);
            }
        });
    }

    // ---- Name lookup (tolerant to stray spaces / letter case) ----
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function normalizeName(value) {
        return String(value).trim().toLowerCase().replace(/\s+/g, " ");
    }

    function buildNameIndex(data) {
        const index = new Map();
        Object.keys(data).forEach((name) => {
            const spaced = normalizeName(name);
            const compact = spaced.replace(/\s+/g, "");
            if (!index.has(spaced)) index.set(spaced, name);
            if (!index.has(compact)) index.set(compact, name);
        });
        return index;
    }

    // Pre-compute a comparable key for every name (trim + lowercase + spaces removed),
    // so "choiheeyeon ", "Choi Hee Yeon" and "CHOIHEEYEON" all line up.
    function buildNameEntries(names) {
        return names.map((name) => ({
            name,
            key: normalizeName(name).replace(/\s+/g, ""),
        }));
    }

    // Rank names against a query: exact → prefix → substring.
    function rankNameMatches(entries, input, limit) {
        const key = normalizeName(input).replace(/\s+/g, "");
        if (!key) return [];
        const scored = [];
        for (const entry of entries) {
            let score = -1;
            if (entry.key === key) score = 0;
            else if (entry.key.startsWith(key)) score = 1;
            else if (entry.key.includes(key)) score = 2;
            if (score >= 0) scored.push({ name: entry.name, score });
        }
        scored.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, "zh"));
        return scored.slice(0, limit || 20).map((x) => x.name);
    }

    function suggestNames(entries, input) {
        return rankNameMatches(entries, input, 5);
    }

    function runSearch(rawName) {
        const input = String(rawName || "").trim();
        const result = window.lookupStudent(input);
        lastQueryName = input;
        lastStudentName = result.name || input;
        lastStudentSessions = result.sessions || null;
        lastSuggestions = result.suggestions || [];
        setDownloadEnabled(Boolean(result.sessions));
        if (result.sessions) {
            renderSchedule(lastStudentName, result.sessions);
        } else {
            renderNoResult(input, lastSuggestions);
        }
    }

    function renderNoResult(query, suggestions) {
        const schedule = document.querySelector("#schedule");
        if (!schedule) return;
        const suggestionHtml = suggestions.length
            ? `<div class="suggestions">${escapeHtml(t("didYouMean"))}${suggestions
                  .map(
                      (name) =>
                          `<button type="button" class="suggestion" data-name="${escapeHtml(name)}">${escapeHtml(name)}</button>`
                  )
                  .join("")}</div>`
            : "";
        schedule.innerHTML = `
            <div class="no-result">
                ${escapeHtml(t("noResult"))}${query ? (lang === "en" ? ": " : "：") + escapeHtml(query) : ""}
                ${suggestionHtml}
                <span class="hint">${escapeHtml(t(suggestions.length ? "noResultHint" : "noResultHintEmpty"))}</span>
            </div>
        `;
        schedule.querySelectorAll(".suggestion").forEach((btn) => {
            btn.addEventListener("click", () => {
                const name = btn.getAttribute("data-name");
                const input = document.querySelector("#student-name");
                if (input) input.value = name;
                runSearch(name);
            });
        });
    }

    // ---- iCalendar (.ics) helpers (Apple Calendar compatible) ----
    function pad2(n) {
        const s = String(n);
        return s.length >= 2 ? s : `0${s}`;
    }

    function icsEscapeText(value) {
        return String(value)
            .replace(/\\/g, "\\\\")
            .replace(/\r\n|\n|\r/g, "\\n")
            .replace(/;/g, "\\;")
            .replace(/,/g, "\\,");
    }


    function normalizeDate(examDate) {
        const parts = String(examDate).trim().split(/[./-]/).filter(Boolean);
        if (parts.length < 3) throw new Error(`Unrecognized examDate format: ${examDate}`);
        return {
            year: Number(parts[0]),
            month: Number(parts[1]),
            day: Number(parts[2]),
        };
    }

    function parseExamTime(examTime) {
        const cleaned = String(examTime).trim();
        const [rawStart, rawEnd] = cleaned.split("-").map((s) => s.trim());
        if (!rawStart || !rawEnd) throw new Error(`Unrecognized examTime format: ${examTime}`);

        const parseOne = (t) => {
            if (t.includes(":")) {
                const [hh, mm] = t.split(":");
                return { h: Number(hh), m: Number(mm) };
            }
            const digits = t.replace(/[^0-9]/g, "");
            const h = digits.length === 3 ? Number(digits.slice(0, 1)) : Number(digits.slice(0, 2));
            const m = Number(digits.slice(-2));
            return { h, m };
        };

        const s = parseOne(rawStart);
        const e = parseOne(rawEnd);
        return { startHour: s.h, startMin: s.m, endHour: e.h, endMin: e.m };
    }

    function formatLocalDateTime(y, mo, d, h, mi) {
        return `${y}${pad2(mo)}${pad2(d)}T${pad2(h)}${pad2(mi)}00`;
    }


    function generateIcsForSessions(ownerName, sessions, opts) {
        const timezone = (opts && opts.timezone) || "Asia/Shanghai";
        const calendarName = (opts && opts.calendarName) || `exam: ${ownerName}`;
        const uidNamespace = (opts && opts.uidNamespace) || "brsexam.approacher.org";
        const includeRoster = Boolean(opts && opts.includeRoster);
        const locale = (opts && opts.locale) || "zh";

        const now = new Date();
        const dtstamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}T${pad2(
            now.getUTCHours(),
        )}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;

        const lines = [];
        lines.push("BEGIN:VCALENDAR");
        lines.push("VERSION:2.0");
        lines.push("PRODID:-//examschedule//ics export//EN");
        lines.push("CALSCALE:GREGORIAN");
        lines.push("METHOD:PUBLISH");
        lines.push(`X-WR-CALNAME:${icsEscapeText(calendarName)}`);
        lines.push(`X-WR-TIMEZONE:${icsEscapeText(timezone)}`);

        const sorted = expandCalendarSessions(sessions, locale).sort((a, b) => {
            const ak = `${a.examDate} ${a.examTime} ${a.subject}`;
            const bk = `${b.examDate} ${b.examTime} ${b.subject}`;
            return ak.localeCompare(bk, "zh");
        });

        for (const s of sorted) {
            const { year, month, day } = normalizeDate(s.examDate);
            const { startHour, startMin, endHour, endMin } = parseExamTime(s.examTime);
            const dtStart = formatLocalDateTime(year, month, day, startHour, startMin);
            const dtEnd = formatLocalDateTime(year, month, day, endHour, endMin);

            const summary = [s.examType || s.grade, s.subjectName || s.subject, s.paperCode].filter(Boolean).join(" ");
            const location = s.location;

            const descriptionParts = [];
            if (locale === "en") {
                descriptionParts.push(`Student: ${ownerName}`);
                descriptionParts.push(`Time: ${s.examDate} ${s.examTime}`);
                descriptionParts.push(`Duration: ${s.minutes} minutes`);
                descriptionParts.push(`Students: ${s.numOfStudents}`);
                if (includeRoster && s.students) {
                    descriptionParts.push(`Roster: ${s.students.join(", ")}`);
                }
            } else {
                descriptionParts.push(`考生: ${ownerName}`);
                descriptionParts.push(`考试时间: ${s.examDate} ${s.examTime}`);
                descriptionParts.push(`时长: ${s.minutes} 分钟`);
                descriptionParts.push(`考生人数: ${s.numOfStudents}`);
                if (includeRoster && s.students) {
                    descriptionParts.push(`考生名单: ${s.students.join(", ")}`);
                }
            }
            if (s.supervisionTime) {
                descriptionParts.push(`${locale === "en" ? "Supervised holding" : "中心监管"}: ${s.supervisionTime}`);
            }
            const description = descriptionParts.join("\n");

            const uid = `${safeUid(ownerName)}-${safeUid(s.examDate)}-${safeUid(s.examTime)}-${safeUid(
                s.subject,
            )}@${safeUid(uidNamespace)}`;

            lines.push("BEGIN:VEVENT");
            lines.push(`UID:${icsEscapeText(uid)}`);
            lines.push(`DTSTAMP:${dtstamp}`);
            lines.push(`DTSTART;TZID=${icsEscapeText(timezone)}:${dtStart}`);
            lines.push(`DTEND;TZID=${icsEscapeText(timezone)}:${dtEnd}`);
            lines.push(`SUMMARY:${icsEscapeText(summary)}`);
            lines.push(`LOCATION:${icsEscapeText(location)}`);
            lines.push(`DESCRIPTION:${icsEscapeText(description)}`);
            lines.push("END:VEVENT");
        }

        lines.push("END:VCALENDAR");
        return lines.map(foldIcsLine).join("\r\n") + "\r\n";
    }

    async function exportIcsToDevice(filename, content) {
        const mime = "text/calendar;charset=utf-8";
        const blob = new Blob([content], { type: mime });
        const file = new File([blob], filename, { type: mime });

        // Best effort for iOS: Share sheet lets users pick “Calendar” directly.
        try {
            if (
                navigator.share &&
                navigator.canShare &&
                navigator.canShare({ files: [file] })
            ) {
                await navigator.share({
                    files: [file],
                    title: filename,
                    text: filename,
                });
                return;
            }
        } catch (e) {
            // User canceled share or share failed; fall back to download/open.
        }

        const url = URL.createObjectURL(blob);

        // Keep existing desktop “download” behavior when supported.
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.rel = "noopener";

        // Some mobile browsers open .ics as text instead of prompting import.
        // If download is not honored, opening the blob URL still allows
        // users to use OS share/import from the file viewer.
        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 10_000);
    }

    let showCheck = false;
    let lastStudentName = "";
    let lastStudentSessions = null;
    let lastQueryName = "";
    let lastSuggestions = [];

    const showCheckbox = document.querySelector("#checkbox-show");
    const showCheckboxIndicator = document.querySelector(
        "#checkbox-show-indicator",
    );

    const downloadIcsBtn = document.querySelector("#download-ics");

        function setDownloadEnabled(enabled) {
        downloadIcsBtn.disabled = !enabled;
        downloadIcsBtn.title = enabled ? t("dlReady") : t("dlNeedSearch");
        }

        function renderSchedule(studentName, testSessions) {
                const schedule = document.querySelector("#schedule");
                schedule.innerHTML = "";

                if (!testSessions || !testSessions.length) {
                        renderNoResult(studentName, []);
                        return;
                }

                for (const session of testSessions) {
                        const dateTime = `${session["examDate"]} ${session.examTime}`;
                        const { supervisionLocation, examLocation } = getSessionLocations(session);
                        schedule.innerHTML += `
                            <div class="test-session">
                                <div class="session-meta">
                                    <div>
                                        ${session.supervisionTime ? `<span>${t("supervision")}</span>${escapeHtml(session.supervisionTime)}${supervisionLocation ? `（${escapeHtml(supervisionLocation)}）` : ""}<br>` : ""}
                                        ${session.supervisionTime ? `<span>${t("formalExam")}</span>` : ""}${escapeHtml(dateTime)}<br><span>${t("len")}</span> ${escapeHtml(session.minutes)} <span>${t("minutes")}</span>
                                    </div>
                                    <div class="exam-title">${[session.examType || session.grade, session.subjectName || session.subject, session.paperCode].filter(Boolean).map(escapeHtml).join(" ")}</div>
                                </div>

                                ${
                                        showCheck
                                                ? `<div class="session-students">
                                    <span>${t("students")}</span>${escapeHtml((session.students || []).join(", "))}  <span>${t(
                                                            "total",
                                                    )}</span>${escapeHtml(session.numOfStudents)}<span>${t("people")}</span>
                                </div>`
                                                : ""
                                }

                                <div class="session-location">
                                    <span>${t("location")}</span>${escapeHtml(examLocation)}
                                </div>
                            </div>
                        `;
                }

        }

    showCheckbox.addEventListener("change", () => {
        showCheck = showCheckbox.checked;
        showCheckboxIndicator.classList.toggle("checked", showCheck);
        // Re-render right away so the roster appears/disappears without
        // forcing the user to search again.
        if (lastStudentSessions && lastStudentName) {
            renderSchedule(lastStudentName, lastStudentSessions);
        }
    });

    // Show a loading state before the (rather large) data file arrives
    const scheduleEl = document.querySelector("#schedule");
    if (scheduleEl) {
        scheduleEl.innerHTML = `<p class="loading">${escapeHtml(t("loading"))}</p>`;
    }

    fetch("./testSessionsByStudent.json")
        .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
        .then((testSessionsByStudent) => {
            const form = document.querySelector("form");

            const studentNames = Object.keys(testSessionsByStudent);
            const nameIndex = buildNameIndex(testSessionsByStudent);
            const studentEntries = buildNameEntries(studentNames);

            // Tolerant lookup: exact → case-insensitive → space-insensitive
            window.lookupStudent = function (input) {
                const raw = String(input || "").trim();
                if (!raw) return { suggestions: [] };
                if (Object.hasOwn(testSessionsByStudent, raw)) {
                    return { name: raw, sessions: testSessionsByStudent[raw] };
                }
                const compactKey = normalizeName(raw).replace(/\s+/g, "");
                const hit = nameIndex.get(compactKey) || nameIndex.get(normalizeName(raw));
                if (hit) {
                    return { name: hit, sessions: testSessionsByStudent[hit] };
                }
                return { suggestions: suggestNames(studentEntries, raw) };
            };

            // Clear the loading state
            if (scheduleEl) scheduleEl.innerHTML = "";

            $(document).ready(function () {
                $("#student-name").autocomplete({
                    minLength: 1,
                    // Case- and space-insensitive matching: typing "choiheeyeon "
                    // still offers the correctly-cased "CHOIHEEYEON" from the roster.
                    source: function (request, response) {
                        response(rankNameMatches(studentEntries, request.term, 20));
                    },
                });
            });

            form.addEventListener("submit", (event) => {
                event.preventDefault();
                const studentName = document.querySelector("#student-name").value;
                runSearch(studentName);
            });

            function doDownload(locale) {
                if (!lastStudentSessions || !lastStudentName) return;
                const ics = generateIcsForSessions(lastStudentName, lastStudentSessions, {
                    calendarName: locale === "en" ? `student: ${lastStudentName}` : `考生: ${lastStudentName}`,
                    timezone: "Asia/Shanghai",
                    uidNamespace: "alevel.local",
                    includeRoster: showCheck,
                    locale,
                });

                const safe = safeUid(lastStudentName) || "student";
                const suffix = locale === "en" ? "en" : "zh";
                exportIcsToDevice(`${safe}-exams-${suffix}.ics`, ics);
            }


            // Single button: export language follows UI language.
            downloadIcsBtn.addEventListener("click", () => {
                doDownload(lang === "en" ? "en" : "zh");
            });

            // Apply language after everything is wired
            applyLanguage();
            setDownloadEnabled(false);
        })
        .catch((err) => {
            console.error(err);
            if (!scheduleEl) return;
            // Keep the page intact (don't wipe the body) and offer a retry.
            scheduleEl.innerHTML = `
                <div class="no-result">
                    ${escapeHtml(t("loadFailTitle"))}
                    <span class="hint">${escapeHtml(t("loadFailHint"))}</span>
                    <button type="button" class="suggestion retry-btn" id="retry-btn">${escapeHtml(t("retry"))}</button>
                </div>
            `;
            const retryBtn = document.getElementById("retry-btn");
            if (retryBtn) retryBtn.addEventListener("click", () => location.reload());
        });
