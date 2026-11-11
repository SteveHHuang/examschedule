// ---- i18n (language switch) ----
    const LANG_KEY = "examschedule.lang";
    let lang = localStorage.getItem(LANG_KEY) || "zh"; // zh | en

    const i18n = {
        zh: {
            title: "BRS考试时刻表查询系统（监考版）",
            updated: "已经更新2026-2027学年第1学期期中考试，请老师们查收",
            permLink: "本网站的永久链接是：https://brsexam.approacher.org/，若您目前在使用临时链接，请保存收藏以免丢失",
            findHint: "如果查不到，请使用希悦档案的名字查询",
            studentLink: "学生考试查询：请访问",
            studentLinkLabel: "学生版",
            proctorPlaceholder: "请输入教师全名",
            submit: "查找考试/自习信息",
            examOnly: "仅显示考试",
            showAll: "显示考试/自习",
            noExams: "当前查询结果没有考试时段。",
            showStudents: "显示考试/自习学生",
            dlIcs: "下载 Apple 日历 (.ics)",
            dlNeedSearch: "请先查询考试信息",
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
            loading: "正在加载监考数据…",
            noResult: "没有查找到考试信息",
            didYouMean: "你是不是要找：",
            noResultHint: "可点击上方姓名直接查询；若确实查不到，请联系相关负责人确认名单。",
            noResultHintEmpty: "没有找到相近的名字；若确实查不到，请联系相关负责人确认名单。",
            loadFailTitle: "无法获取考试信息",
            loadFailHint: "请检查网络连接后重试。",
            retry: "重试",
        },
        en: {
            title: "BRS Exam Schedule Lookup System (Proctor Edition)",
            updated: "Updated for 2026–2027 Semester 1 Midterm Exams",
            permLink:
                "Permanent link: https://brsexam.approacher.org/ (if you're using a temporary link, please bookmark it)",
            findHint: "If you can't find your schedule, please search using the name on your 希悦 (student record) profile",
            studentLink: "Student please visit",
            studentLinkLabel: "Student Version",
            proctorPlaceholder: "Enter full teacher name",
            submit: "Find Proctoring Sessions",
            examOnly: "Show Exams Only",
            showAll: "View Exams/Self-study",
            noExams: "No exam sessions in these results.",
            showStudents: "Show students",
            dlIcs: "Download Apple Calendar (.ics)",
            dlNeedSearch: "Please search first",
            dlReady: "Download and import into Apple Calendar",
            errNoData: "No proctoring session found",
            errFetch: "Unable to load proctoring sessions",
            len: "Duration: ",
            minutes: "minutes",
            students: "Students: ",
            studyStudents: "Self-study students: ",
            total: "Total ",
            people: "",
            location: "Location: ",

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
            loading: "Loading proctoring data…",
            noResult: "No proctoring session found",
            didYouMean: "Did you mean: ",
            noResultHint: "Tap a suggested name above to search it. If it is still missing, please contact the exam coordinator.",
            noResultHintEmpty: "No similar name found. If it is still missing, please contact the exam coordinator.",
            loadFailTitle: "Unable to load proctoring sessions",
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
        const h1 = document.querySelector("h1");
        if (h1) h1.textContent = t("title");

        // Header lines: address them by id (order-independent, survives new lines).
        setText("#line-updated", t("updated"));
        setText("#line-permalink", t("permLink"));
        setText("#line-findhint", t("findHint"));

        const studentLink = document.querySelector("#student-link");
        if (studentLink) {
            const a = studentLink.querySelector("a");
            studentLink.innerHTML = "";
            studentLink.appendChild(document.createTextNode(t("studentLink") + " "));
            if (a) {
                a.textContent = t("studentLinkLabel");
                studentLink.appendChild(a);
            }
        }

        const proctorInput = document.querySelector("#proctor-name");
        if (proctorInput) proctorInput.placeholder = t("proctorPlaceholder");

        const submitBtn = document.querySelector("form button[type='submit']");
        if (submitBtn) submitBtn.textContent = ScheduleLoader.status === "loading" ? t("loading") : t("submit");
        const loadingMessage = document.querySelector("#schedule .loading");
        if (loadingMessage) loadingMessage.textContent = t("loading");
        updateExamOnlyButton();

        const showLabel = document.querySelector("label[for='checkbox-show']");
        if (showLabel) showLabel.textContent = t("showStudents");

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
            if (lastProctorSessions && lastProctorName) {
                renderSchedule(lastProctorName, lastProctorSessions);
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
        const result = lookupProctor(input);
        lastQueryName = input;
        lastProctorName = result.name || input;
        lastProctorSessions = result.sessions || null;
        lastSuggestions = result.suggestions || [];
        setDownloadEnabled(Boolean(result.sessions));
        if (result.sessions) {
            renderSchedule(lastProctorName, result.sessions);
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
                const input = document.querySelector("#proctor-name");
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
        const calendarName = (opts && opts.calendarName) || `proctor: ${ownerName}`;
        const uidNamespace = (opts && opts.uidNamespace) || "exam.plushugh.com";
        const locale = (opts && opts.locale) || "zh"; // zh | en

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

            const proctors = [s.proctor1, s.proctor2].filter(Boolean).join(" / ");

            // Language toggles: subject stays as-is, but labels change.
            const classPart =
                s.classes && s.classes.length
                    ? s.classes.join("、")
                    : `${s.grade}${s.classNum ? " " + s.classNum : ""}`;
            const summary = s.kind === "study" ? (locale === "en" ? "Self-study supervision" : "自习看班") :
                locale === "en"
                    ? `Proctor: ${s.subject} (${classPart})`
                    : `监考: ${s.subject} (${classPart})`;

            const descriptionParts = [];
            if (locale === "en") {
                descriptionParts.push(`${s.kind === "study" ? "Supervisor" : "Proctor"}: ${ownerName}`);
                descriptionParts.push(`Time: ${s.examDate} ${s.examTime}`);
                descriptionParts.push(`Duration: ${s.minutes} minutes`);
                if (proctors) descriptionParts.push(`Proctored by: ${proctors}`);
                descriptionParts.push(`Students: ${s.numOfStudents}`);
                // Always include roster for proctor exports
                descriptionParts.push(`Roster: ${(s.students || []).join(", ")}`);
            } else {
                descriptionParts.push(`${s.kind === "study" ? "看班老师" : "监考老师"}: ${ownerName}`);
                descriptionParts.push(`时间: ${s.examDate} ${s.examTime}`);
                descriptionParts.push(`时长: ${s.minutes} 分钟`);
                if (proctors) descriptionParts.push(`监考: ${proctors}`);
                descriptionParts.push(`学生人数: ${s.numOfStudents}`);
                // Always include roster for proctor exports
                descriptionParts.push(`学生名单: ${(s.students || []).join(", ")}`);
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
            lines.push(`LOCATION:${icsEscapeText(s.location)}`);
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
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.rel = "noopener";

        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 10_000);
    }

    let showCheck = false;
    let lastProctorName = "";
    let lastProctorSessions = null;
    let lastQueryName = "";
    let lastSuggestions = [];

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
        if (lastProctorSessions && lastProctorName) {
            renderSchedule(lastProctorName, lastProctorSessions);
        }
    });

    const downloadIcsBtn = document.querySelector("#download-ics");

    const showCheckbox = document.querySelector("#checkbox-show");
    const showCheckboxIndicator = document.querySelector(
        "#checkbox-show-indicator",
    );

    function setDownloadEnabled(enabled) {
        downloadIcsBtn.disabled = !enabled;
        downloadIcsBtn.title = enabled ? t("dlReady") : t("dlNeedSearch");
    }

        function renderSchedule(proctorName, testSessions) {
                const schedule = document.querySelector("#schedule");
                schedule.innerHTML = "";

                if (!testSessions || !testSessions.length) {
                        renderNoResult(proctorName, []);
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
                            schedule.innerHTML += `<div class="test-session study-session">
                                <div><div>${escapeHtml(session.examDate)} ${escapeHtml(formatExamTime(session.examTime))}<br><span>${t("len")}</span> ${escapeHtml(session.minutes)} <span>${t("minutes")}</span></div><div>${isEn ? "Self-study" : "自习"}</div></div>
                                ${showCheck ? `<div><span>${t("studyStudents")}</span>${session.students.map(escapeHtml).join(", ")} <span>${t("total")}</span>${session.numOfStudents}<span>${t("people")}</span></div>` : ""}
                                <div class="session-location"><span>${isEn ? "Study location: " : "自习地点："}${escapeHtml(session.location || (isEn ? "Not specified" : "未注明"))}</span></div>
                            </div>`;
                            continue;
                        }
                        const dateTime = `${session["examDate"]} ${formatExamTime(session.examTime)}`;
                        const classList = session.classes && session.classes.length
                                ? session.classes.join("、")
                                : `${session.grade}${session.classNum ? " " + session.classNum : ""}`;
                        const noteLabel = session.proctorNote
                                ? `<div class="proctor-note">${escapeHtml(proctorName)}（${escapeHtml(session.proctorNote)}）</div>`
                                : "";
                        schedule.innerHTML += `
                            <div class="test-session">
                                <div>
                                    <div>
                                        ${dateTime}<br><span>${t("len")}</span> ${session.minutes} <span>${t("minutes")}</span>
                                    </div>
                                    <div>${session.subject}</div>
                                    <div>${classList}</div>
                                    ${noteLabel}
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

                                <div class="session-location">
                                    <span>${t("location")}</span>${session.location}
                                </div>
                            </div>
                        `;
                }
        }

    showCheckbox.addEventListener("change", () => {
        showCheck = showCheckbox.checked;
        showCheckboxIndicator.classList.toggle("checked", showCheck);
        // Re-render right away so the student list appears/disappears without
        // forcing the user to search again.
        if (lastProctorSessions && lastProctorName) {
            renderSchedule(lastProctorName, lastProctorSessions);
        }
    });

    // Show a loading state before the data file arrives
    const scheduleEl = document.querySelector("#schedule");
    if (scheduleEl) {
        scheduleEl.innerHTML = `<p class="loading">${escapeHtml(t("loading"))}</p>`;
    }

    applyLanguage();
    ScheduleLoader.load("./testSessionsByProctor.json")
        .then((testSessionsByProctor) => {
            const form = document.querySelector("form");

            const proctorNames = Object.keys(testSessionsByProctor);
            const nameIndex = buildNameIndex(testSessionsByProctor);
            const proctorEntries = buildNameEntries(proctorNames);

            // Tolerant lookup: exact → case-insensitive → space-insensitive
            window.lookupProctor = function (input) {
                const raw = String(input || "").trim();
                if (!raw) return { suggestions: [] };
                if (testSessionsByProctor[raw]) {
                    return { name: raw, sessions: testSessionsByProctor[raw] };
                }
                const compactKey = normalizeName(raw).replace(/\s+/g, "");
                const hit = nameIndex.get(compactKey) || nameIndex.get(normalizeName(raw));
                if (hit) {
                    return { name: hit, sessions: testSessionsByProctor[hit] };
                }
                return { suggestions: suggestNames(proctorEntries, raw) };
            };

            // Clear the loading state
            if (scheduleEl) scheduleEl.innerHTML = "";

            (() => {
                $("#proctor-name").autocomplete({
                    minLength: 1,
                    // Case- and space-insensitive matching: typing "zhang bingyi "
                    // still offers the correctly-cased name from the roster.
                    source: function (request, response) {
                        response(rankNameMatches(proctorEntries, request.term, 20));
                    },
                });
            })();

            form.addEventListener("submit", (event) => {
                event.preventDefault();

                const proctorName = document.querySelector("#proctor-name").value;

                runSearch(proctorName);
            });

            function doDownload(locale) {
                if (!lastProctorSessions || !lastProctorName) return;
                const ics = generateIcsForSessions(lastProctorName, visibleSessions(lastProctorSessions), {
                    calendarName: locale === "en" ? `proctor: ${lastProctorName}` : `监考: ${lastProctorName}`,
                    timezone: "Asia/Shanghai",
                    uidNamespace: "exam.plushugh.com",
                    locale,
                });

                const safe = safeUid(lastProctorName) || "proctor";
                const suffix = locale === "en" ? "en" : "zh";
                exportIcsToDevice(`${safe}-proctor-${suffix}.ics`, ics);
            }

            // Single button: export language follows UI language.
            downloadIcsBtn.addEventListener("click", () => {
                doDownload(lang === "en" ? "en" : "zh");
            });

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
