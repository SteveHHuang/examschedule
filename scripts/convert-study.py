"""Read the three grade study workbooks into study.csv; never edit source workbooks."""
import csv, datetime, hashlib, json, re, sys
from pathlib import Path
import openpyxl
from openpyxl.utils.datetime import from_excel


def clean(v):
    return '' if v is None else str(int(v) if isinstance(v,float) and v.is_integer() else v).strip()


def merged_values(sheet):
    values={(c.row,c.column):c.value for row in sheet for c in row if c.value is not None}
    for region in sheet.merged_cells.ranges:
        value=sheet.cell(region.min_row,region.min_col).value
        for row in range(region.min_row,region.max_row+1):
            for col in range(region.min_col,region.max_col+1): values[row,col]=value
    return lambda row,col:clean(values.get((row,col)))


def time_value(value):
    m=re.fullmatch(r'(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})',value.replace('：',':'))
    if not m: raise ValueError('Invalid time: '+value)
    h,mn,eh,em=map(int,m.groups());minutes=eh*60+em-h*60-mn
    assert h<24 and eh<24 and mn<60 and em<60 and minutes>0,value
    return f'{h:02d}:{mn:02d}-{eh:02d}:{em:02d}',str(minutes)


def convert(paths, output, audit_path):
    sessions={};audit={'sources':[],'countDifferences':[],'duplicateRosterNames':[],'missingLocations':[]}
    def add(date,time,location,teacher,grade,students,file,sheet,row,declared=None):
        time,minutes=time_value(time)
        names=[clean(n) for n in students if clean(n)]
        if len(names)!=len(set(names)):audit['duplicateRosterNames'].append([file,sheet,row])
        names=list(dict.fromkeys(names))
        if not names:return
        if declared is not None:
            nums=re.findall(r'\d+',clean(declared))
            if nums and sum(map(int,nums))!=len(names):audit['countDifferences'].append({'file':file,'sheet':sheet,'row':row,'declared':declared,'actual':len(names)})
        if not location:audit['missingLocations'].append({'file':file,'sheet':sheet,'row':row,'students':names})
        key=(date,time,location,teacher,grade,file,sheet)
        if key not in sessions:sessions[key]=dict(examDate=date,examTime=time,minutes=minutes,location=location,supervisor=teacher,grade=grade,sourceFile=file,sourceSheet=sheet,sourceRows=[],students=[])
        session=sessions[key];session['sourceRows'].append(str(row));session['students']=list(dict.fromkeys(session['students']+names))
    for index,path in enumerate(paths):
        path=Path(path);w=openpyxl.load_workbook(path,data_only=True)
        audit['sources'].append({'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
        for sheet in w:
            get=merged_values(sheet)
            if index==0:
                date=from_excel(sheet['A1'].value,w.epoch).strftime('%Y.%m.%d')
                for row in range(3,sheet.max_row+1):
                    names=[sheet.cell(row,col).value for col in range(7,sheet.max_column+1)]
                    add(date,get(row,3),re.search(r'\d{4}',get(row,4)).group() if re.search(r'\d{4}',get(row,4)) else get(row,4),get(row,6),'高一',names,path.name,sheet.title,row,get(row,5))
            elif index==1:
                md=re.search(r'(\d+)月(\d+)日',sheet.title);assert md
                date=f'2026.{int(md[1]):02d}.{int(md[2]):02d}'
                starts=[c.column for c in sheet[2] if c.value=='时间']
                for start in starts:
                    end=next((c for c in starts if c>start),sheet.max_column+1)
                    headers={clean(sheet.cell(2,c).value):c for c in range(start,end)}
                    last_room=last_teacher=''
                    for row in range(3,sheet.max_row+1):
                        name=clean(sheet.cell(row,headers['学生']).value)
                        if name:
                            room=get(row,headers['教室'])
                            teacher=get(row,headers['自习老师']) if '自习老师' in headers else ''
                            # Vertical student lists share room/teacher until the next labelled room.
                            if room and room!=last_room:last_teacher=''
                            last_room=room or last_room;last_teacher=teacher or last_teacher
                            add(date,get(row,start),last_room,last_teacher,'高二',[name],path.name,sheet.title,row)
            else:
                for row in range(3,sheet.max_row+1):
                    names=[sheet.cell(row,c).value for c in range(10,sheet.max_column+1)]
                    if not any(clean(n) for n in names):continue
                    raw=get(row,1)
                    # Dates in this workbook are text, retaining the day 10 rather than float 11.1.
                    md=re.fullmatch(r'(\d+)\.(\d+)',raw);assert md,raw
                    date=f'2026.{int(md[1]):02d}.{int(md[2]):02d}'
                    add(date,get(row,3),get(row,4),get(row,5),'高三',names,path.name,sheet.title,row,get(row,9))
    records=list(sessions.values());max_names=max(len(s['students']) for s in records)
    fields=[k for k in records[0] if k!='students']+['s'+str(i+1) for i in range(max_names)]
    with Path(output).open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=fields,lineterminator='\n');writer.writeheader()
        for session in records:
            values={k:','.join(v) if k=='sourceRows' else v for k,v in session.items() if k!='students'}
            values.update({'s'+str(i+1):n for i,n in enumerate(session['students'])});writer.writerow(values)
    audit['sessions']=len(records);audit['registrations']=sum(len(s['students']) for s in records);audit['students']=len({n for s in records for n in s['students']})
    audit['grades']={g:sum(s['grade']==g for s in records) for g in ['高一','高二','高三']}
    audit['missingSupervisor']=[{k:s[k] for k in ['examDate','examTime','location','grade']} for s in records if s['supervisor'] in ['', '/', '-']]
    Path(audit_path).write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in audit.items() if k in ['sessions','registrations','students','grades']},ensure_ascii=False))

if __name__=='__main__':
    if len(sys.argv)!=6:raise SystemExit('Usage: convert-study.py grade1.xlsx grade2.xlsx grade3.xlsx study.csv audit.json')
    convert(sys.argv[1:4],sys.argv[4],sys.argv[5])
