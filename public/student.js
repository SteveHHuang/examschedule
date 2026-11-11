// ---- i18n (language switch) ----
    const LANG_KEY = "examschedule.lang";
    let lang = localStorage.getItem(LANG_KEY) || "zh"; // zh | en

    const i18n = {
        zh: {
            title: "BRS考试时刻表查询系统",
            updated: "已经更新2026-2027学年第1学期期中考试，请同学们查收",
            permLink: "本网站的永久链接是：https://brsexam.approacher.org/，若您目前在使用临时链接，请保存收藏以免丢失",
            findHint: "如果查不到，请使用希悦档案的名字查询",
            teacherLink: "教师监考查询：请访问",
            teacherLinkLabel: "教师版",
            alevelLinkLabel: "alevel考试信息点这里",
            studentPlaceholder: "请输入学生全名",
            submit: "查找考试/自习信息",
            examOnly: "仅显示考试",
            showAll: "显示考试/自习",
            noExams: "当前查询结果没有考试时段。",
            showOthers: "显示考试/自习其他学生",
            dlIcs: "下载 Apple 日历 (.ics)",
            dlNeedSearch: "先查询考试信息后再下载",
            dlReady: "下载并导入到 Apple 日历",
            errNoData: "没有查找到考试信息",
            errFetch: "无法获取考试信息",
            len: "时长：",
            minutes: "分钟",
            students: "考试学生：",
            studyStudents: "自习学生：",
            total: "共计",
            people: "人",
            location: "考试地点：",
            proctoredBy1: "由",
            proctoredBy2: "和",
            proctoredBy3: "监考",

            // footer / disclaimer
            contribHtml: `这是一个 <a href="https://fsf.org">自由软件</a> 项目，由 <a href="https://github.com/plushugh/examschedule">@plushugh</a> 开发，目前使用版本由 <a href="https://github.com/SteveHHuang/examschedule">@SteveHHuang</a> 运营维护。`,
            disclaimerLabel: "反馈/免责声明",
            disclaimerText:
                "免责声明：本服务提供的考试信息仅供参考，不一定反映真实考试信息，具体请参照官方公布的考试信息。",
            contactNotice:
                "本版本增加了深色模式（右上角可切换）和自习时段，如果有任何的bug或是建议，请联系开发者。",
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
            title: "BRS Exam Schedule Lookup System",
            updated: "Updated for 2026–2027 Semester 1 Midterm Exams",
            permLink:
                "Permanent link: https://brsexam.approacher.org/ (if you're using a temporary link, please bookmark it)",
            findHint: "If you can't find your schedule, please search using the name on your 希悦 (student record) profile",
            teacherLink: "Proctor Sessions Lookup: please visit",
            teacherLinkLabel: "Teacher Version",
            alevelLinkLabel: "Click here to find out alevel exam information",
            studentPlaceholder: "Enter full student name",
            submit: "Find Exam/Self-study Sessions",
            examOnly: "Show Exams Only",
            showAll: "View Exams/Self-study",
            noExams: "No exam sessions in these results.",
            showOthers: "Show other students",
            dlIcs: "Download Apple Calendar (.ics)",
            dlNeedSearch: "Search first",
            dlReady: "Download and import into Apple Calendar",
            errNoData: "No exam session found",
            errFetch: "Unable to load exam sessions",
            len: "Duration: ",
            minutes: "minutes",
            students: "Students: ",
            studyStudents: "Self-study students: ",
            total: "Total ",
            people: "",
            location: "Location: ",
            proctoredBy1: "Proctored by ",
            proctoredBy2: " and ",
            proctoredBy3: "",

            // footer / disclaimer
            contribHtml: `This is a <a href="https://fsf.org">Free Software</a> project, developed by <a href="https://github.com/plushugh/examschedule">@plushugh</a> on GitHub, currently maintained by <a href="https://github.com/SteveHHuang/examschedule">@SteveHHuang</a>.`,
            disclaimerLabel: "Feedback / Disclaimer",
            disclaimerText:
                "Disclaimer: The exam information provided by this service is for reference only and does not necessarily reflect the actual exam information. Please refer to the official exam information for details.",
            contactNotice:
                "This version adds a dark mode (toggle in the top-right corner) and self-study periods. If you notice any bugs or have suggestions, please contact the developer.",
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
        setText("#alevel-link a", t("alevelLinkLabel"));

        const teacherLink = document.querySelector("#teacher-link");
        if (teacherLink) {
            const a = teacherLink.querySelector("a");
            teacherLink.innerHTML = "";
            teacherLink.appendChild(document.createTextNode(t("teacherLink") + " "));
            if (a) {
                a.textContent = t("teacherLinkLabel");
                teacherLink.appendChild(a);
            }
        }

        const studentInput = document.querySelector("#student-name");
        if (studentInput) studentInput.placeholder = t("studentPlaceholder");

        const submitBtn = document.querySelector("form button[type='submit']");
        if (submitBtn) submitBtn.textContent = ScheduleLoader.status === "loading" ? t("loading") : t("submit");
        const loadingMessage = document.querySelector("#schedule .loading");
        if (loadingMessage) loadingMessage.textContent = t("loading");
        updateExamOnlyButton();

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
        const result = lookupStudent(input);
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

    function foldIcsLine(line) {
        const limit = 75;
        if (line.length <= limit) return line;
        let out = "";
        for (let i = 0; i < line.length; i += limit) {
            const chunk = line.slice(i, i + limit);
            out += i === 0 ? chunk : `\r\n ${chunk}`;
        }
        return out;
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

    function safeUid(input) {
        return String(input)
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^A-Za-z0-9._-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
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

        const sorted = [...sessions].sort((a, b) => {
            const ak = `${a.examDate} ${a.examTime} ${a.subject}`;
            const bk = `${b.examDate} ${b.examTime} ${b.subject}`;
            return ak.localeCompare(bk, "zh");
        });

        for (const s of sorted) {
            const { year, month, day } = normalizeDate(s.examDate);
            const { startHour, startMin, endHour, endMin } = parseExamTime(s.examTime);
            const dtStart = formatLocalDateTime(year, month, day, startHour, startMin);
            const dtEnd = formatLocalDateTime(year, month, day, endHour, endMin);

            const classPart = s.classNum ? s.classNum : "";
            const summary = s.kind === "study" ? (locale === "en" ? "Self-study" : "自习") :
                locale === "en"
                    ? `${s.subject} (${s.grade}${classPart})`
                    : `${s.subject} (${s.grade}${classPart})`;
            const location = s.location;
            const proctors = s.kind === "study" ? (s.supervisor || "未注明") : [s.proctor1, s.proctor2].filter(Boolean).join(" / ");

            const descriptionParts = [];
            if (locale === "en") {
                descriptionParts.push(`Student: ${ownerName}`);
                descriptionParts.push(`Time: ${s.examDate} ${s.examTime}`);
                descriptionParts.push(`Duration: ${s.minutes} minutes`);
                descriptionParts.push(`Proctor(s): ${proctors}`);
                descriptionParts.push(`Students: ${s.numOfStudents}`);
                if (includeRoster && s.students) {
                    descriptionParts.push(`Roster: ${s.students.join(", ")}`);
                }
            } else {
                descriptionParts.push(`考生: ${ownerName}`);
                descriptionParts.push(`考试时间: ${s.examDate} ${s.examTime}`);
                descriptionParts.push(`时长: ${s.minutes} 分钟`);
                descriptionParts.push(`${s.kind === "study" ? "看班" : "监考"}: ${proctors}`);
                descriptionParts.push(`考生人数: ${s.numOfStudents}`);
                if (includeRoster && s.students) {
                    descriptionParts.push(`考生名单: ${s.students.join(", ")}`);
                }
            }
            const description = descriptionParts.join("\n");

            const uid = `${safeUid(ownerName)}-${safeUid(s.examDate)}-${safeUid(s.examTime)}-${safeUid(
                s.subject,
            )}@${safeUid(uidNamespace)}`;

            lines.push("BEGIN:VEVENT");
            const eventUid = s.kind === "study" ? `${encodeURIComponent(ownerName)}-${s.examDate}-${s.examTime}-study-${encodeURIComponent(s.location)}@${safeUid(uidNamespace)}` : uid;
            lines.push(`UID:${icsEscapeText(eventUid)}`);
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

    let examOnly = false;
    const examOnlyBtn = document.querySelector("#exam-only");
    function visibleSessions(sessions) {
        return examOnly ? sessions.filter(session => session.kind !== "study") : sessions;
    }
    function updateExamOnlyButton() {
        document.querySelector("label[for='exam-only']").textContent = t("examOnly");
        examOnlyBtn.checked = examOnly;
        document.querySelector("#exam-only-indicator").classList.toggle("checked", examOnly);
    }
    examOnlyBtn.addEventListener("change", () => {
        examOnly = examOnlyBtn.checked;
        updateExamOnlyButton();
        if (lastStudentSessions && lastStudentName) {
            renderSchedule(lastStudentName, lastStudentSessions);
        }
    });

    const downloadIcsBtn = document.querySelector("#download-ics");

        function setDownloadEnabled(enabled) {
        downloadIcsBtn.disabled = !enabled;
        downloadIcsBtn.title = enabled ? t("dlReady") : t("dlNeedSearch");
        }

        function renderSchedule(studentName, testSessions) {
                const schedule = document.querySelector("#schedule");
                schedule.innerHTML = "";

                function splitProctorNames(s) {
                    return (s || "").trim().split(/[\n、,，]/).map(x => x.trim()).filter(x => x && x !== "/" && x !== "\\" && x !== "-");
                }

                function formatProctors(session) {
                    const names = [...new Set([
                        ...splitProctorNames(session.proctor1),
                        ...splitProctorNames(session.proctor2),
                    ])];
                    if (names.length === 0) {
                        return `<span>${t("proctoredBy1")}</span><span>${t("proctoredBy3")}</span>`;
                    }
                    if (names.length === 1) {
                        return `<span>${t("proctoredBy1")}</span><span class="proctor-name" title="${escapeHtml(names[0])}">${escapeHtml(names[0])}</span><span>${t("proctoredBy3")}</span>`;
                    }
                    const rest = names.slice(1).join("、");
                    return `<span>${t("proctoredBy1")}</span><span class="proctor-name" title="${escapeHtml(names[0])}">${escapeHtml(names[0])}</span><span>${t("proctoredBy2")}</span><span class="proctor-name" title="${escapeHtml(rest)}">${escapeHtml(rest)}</span><span>${t("proctoredBy3")}</span>`;
                }

                if (!testSessions || !testSessions.length) {
                        renderNoResult(studentName, []);
                        return;
                }

                const displayedSessions = visibleSessions(testSessions);
                if (!displayedSessions.length) {
                    schedule.innerHTML = `<p>${escapeHtml(t("noExams"))}</p>`;
                    return;
                }
                for (const session of displayedSessions) {
                        if (session.kind === "study") {
                            const isEn = lang === "en";
                            const teacher = session.supervisor && !["/", "-"].includes(session.supervisor) ? session.supervisor : (isEn ? "Not specified" : "未注明");
                            schedule.innerHTML += `<div class="test-session study-session">
                                <div><div>${escapeHtml(session.examDate)} ${escapeHtml(formatExamTime(session.examTime))}<br><span>${t("len")}</span> ${escapeHtml(session.minutes)} <span>${t("minutes")}</span></div><div>${isEn ? "Self-study" : "自习"}</div></div>
                                ${showCheck ? `<div><span>${t("studyStudents")}</span>${session.students.map(escapeHtml).join(", ")} <span>${t("total")}</span>${session.numOfStudents}<span>${t("people")}</span></div>` : ""}
                                <div><span>${isEn ? "Study location: " : "自习地点："}</span>${escapeHtml(session.location || (isEn ? "Not specified" : "未注明"))}</div>
                                <div><span>${isEn ? "Supervised by " : "由"}</span><span class="proctor-name" title="${escapeHtml(teacher)}">${escapeHtml(teacher)}</span><span>${isEn ? "" : "看班"}</span></div>
                            </div>`;
                            continue;
                        }
                        const dateTime = `${session["examDate"]} ${formatExamTime(session.examTime)}`;
                        schedule.innerHTML += `
                            <div class="test-session">
                                <div>
                                    <div>
                                        ${dateTime}<br><span>${t("len")}</span> ${session.minutes} <span>${t("minutes")}</span>
                                    </div>
                                    <div>${session.subject} ${session.grade}${session.classNum ? " " + session.classNum : ""}</div>
                                </div>

                                ${
                                        showCheck
                                                ? `<div>
                                    <span>${t("students")}</span>${session.students && session.students.join(", ")}  <span>${t(
                                                            "total",
                                                    )}</span>${session.numOfStudents}<span>${t("people")}</span>
                                </div>`
                                                : ""
                                }

                                <div>
                                    <span>${t("location")}</span>${session.location}
                                </div>

                                <div>
                                    ${formatProctors(session)}
                                </div>
                            </div>
                        `;
                }

                fitProctorNames();
        }

    // A single very long proctor name would otherwise wrap and make its whole row
    // of cards taller than the others. Only the widest names are allowed to
    // shorten (with an ellipsis), so every card keeps the same height.
    function fitProctorNames() {
        document.querySelectorAll(".test-session").forEach((card) => {
            const row = card.lastElementChild;
            if (!row) return;
            const names = Array.from(row.querySelectorAll(".proctor-name"));
            if (!names.length) return;
            const items = Array.from(row.children);
            const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
            const overflow = () => {
                const total =
                    items.reduce((sum, el) => sum + el.getBoundingClientRect().width, 0) +
                    gap * (items.length - 1);
                return total - row.clientWidth;
            };
            names.forEach((name) => {
                name.style.flexShrink = "0";
            });
            const widestFirst = names
                .slice()
                .sort((a, b) => b.scrollWidth - a.scrollWidth);
            for (const name of widestFirst) {
                if (overflow() <= 0.5) break;
                name.style.flexShrink = "1";
            }
        });
    }

    // Re-fit whenever the layout can change (window resize / web-font load),
    // otherwise a narrow window could leave the line overflowing again.
    let proctorFitTimer = 0;
    window.addEventListener("resize", () => {
        clearTimeout(proctorFitTimer);
        proctorFitTimer = setTimeout(fitProctorNames, 120);
    });
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => fitProctorNames());
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

    applyLanguage();
    ScheduleLoader.load("./testSessionsByStudent.json")
        .then((testSessionsByStudent) => {
            const form = document.querySelector("form");

            const studentNames = Object.keys(testSessionsByStudent);
            const nameIndex = buildNameIndex(testSessionsByStudent);
            const studentEntries = buildNameEntries(studentNames);

            // Tolerant lookup: exact → case-insensitive → space-insensitive
            window.lookupStudent = function (input) {
                const raw = String(input || "").trim();
                if (!raw) return { suggestions: [] };
                if (testSessionsByStudent[raw]) {
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
            
            (() => {
                $("#student-name").autocomplete({
                    minLength: 1,
                    // Case- and space-insensitive matching: typing "choiheeyeon "
                    // still offers the correctly-cased "CHOIHEEYEON" from the roster.
                    source: function (request, response) {
                        response(rankNameMatches(studentEntries, request.term, 20));
                    },
                });
            })();

            form.addEventListener("submit", (event) => {
                event.preventDefault();
                const studentName = document.querySelector("#student-name").value;
                runSearch(studentName);
            });

            function doDownload(locale) {
                if (!lastStudentSessions || !lastStudentName) return;
                const ics = generateIcsForSessions(lastStudentName, visibleSessions(lastStudentSessions), {
                    calendarName: locale === "en" ? `student: ${lastStudentName}` : `考生: ${lastStudentName}`,
                    timezone: "Asia/Shanghai",
                    uidNamespace: "brsexam.approacher.org",
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
            ScheduleLoader.ready();
            applyLanguage();
            setDownloadEnabled(false);
        })
        .catch((err) => {
            ScheduleLoader.failed();
            applyLanguage();
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
