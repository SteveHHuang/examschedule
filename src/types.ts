export interface TestSession {
    examDate: string;
    examTime: string;
    subject: string;
    grade: string;
    classNum: string;
    minutes: string;
    location: string;
    proctor1: string;
    proctor2: string | null;
    numOfStudents: string;
    students: string[];
}

export interface CalendarExportOptions {
    calendarName: string;
    timezone?: string;
    uidNamespace?: string;
    includeRoster?: boolean;
    kind?: "student" | "proctor";
    locale?: "zh" | "en";
}
