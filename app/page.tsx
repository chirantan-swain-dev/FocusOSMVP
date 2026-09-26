"use client";

import { useEffect, useMemo, useState } from "react";

type Priority="Low"|"Medium"|"High";
type Task={id:number;title:string;done:boolean;priority:Priority;minutes:number};
type Habit={id:number;name:string;completed:boolean};

const seedTasks:Task[]=[
{id:1,title:"Review today's priorities",done:false,priority:"High",minutes:10},
{id:2,title:"Finish FocusOS landing page",done:false,priority:"High",minutes:45},
{id:3,title:"Reply to important messages",done:false,priority:"Medium",minutes:20},
{id:4,title:"Plan tomorrow",done:false,priority:"Low",minutes:10},
{id:5,title:"Send an email",done:false,priority:"Medium",minutes:20}];
const seedHabits:Habit[]=[
{id:1,name:"Drink water",completed:true},{id:2,name:"10-minute walk",completed:false},{id:3,name:"Read / learn",completed:false}];
const navItems=[["Dashboard","⌂"],["Tasks","✓"],["Habits","↻"],["Goals","◎"],["Focus","◉"]] as const;

export default function Home(){
 const [tab,setTab]=useState("Dashboard"),[energy,setEnergy]=useState<"Low"|"Medium"|"High">("Medium"),[tasks,setTasks]=useState<Task[]>(seedTasks),[habits,setHabits]=useState<Habit[]>(seedHabits),[newTask,setNewTask]=useState(""),[seconds,setSeconds]=useState(1500),[running,setRunning]=useState(false),[focusedTaskId,setFocusedTaskId]=useState<number|null>(null),[selectedTask,setSelectedTask]=useState<Task|null>(null),[quickTask,setQuickTask]=useState("");

 useEffect(()=>{try{const s=JSON.parse(localStorage.getItem("focusos")||"{}");if(s.tasks)setTasks(s.tasks);if(s.habits)setHabits(s.habits);if(s.energy)setEnergy(s.energy)}catch{}},[]);
 useEffect(()=>{localStorage.setItem("focusos",JSON.stringify({tasks,habits,energy}))},[tasks,habits,energy]);

 useEffect(()=>{
  if(!running)return;
  const timer=setInterval(()=>setSeconds(v=>{
   if(v<=1){
    setRunning(false);
    if(focusedTaskId)setTasks(prev=>prev.map(t=>t.id===focusedTaskId?{...t,done:true}:t));
    return 1500;
   }
   return v-1;
  }),1000);
  return()=>clearInterval(timer);
 },[running,focusedTaskId]);

 const done=tasks.filter(t=>t.done).length,pct=tasks.length?Math.round(done/tasks.length*100):0,completedHabits=habits.filter(h=>h.completed).length;
 const next=useMemo(()=>tasks.find(t=>!t.done&&t.priority==="High")||tasks.find(t=>!t.done),[tasks]);
 const focusedTask=focusedTaskId?tasks.find(t=>t.id===focusedTaskId):null;
 const mm=String(Math.floor(seconds/60)).padStart(2,"0"),ss=String(seconds%60).padStart(2,"0");

 const addTask=(title:string,priority:Priority="Medium",minutes=20)=>{
  const clean=title.trim();if(!clean)return;
  setTasks(v=>[...v,{id:Date.now()+Math.floor(Math.random()*1000),title:clean,done:false,priority,minutes}]);
 };
 const submitTask=()=>{addTask(newTask);setNewTask("")};
 const quickAdd=()=>{addTask(quickTask);setQuickTask("")};
 const toggleTask=(id:number)=>setTasks(v=>v.map(t=>t.id===id?{...t,done:!t.done}:t));
 const deleteTask=(id:number)=>{setTasks(v=>v.filter(t=>t.id!==id));if(selectedTask?.id===id)setSelectedTask(null)};
 const saveTask=(updated:Task)=>{setTasks(v=>v.map(t=>t.id===updated.id?updated:t));setSelectedTask(null)};
 const toggleHabit=(id:number)=>setHabits(v=>v.map(h=>h.id===id?{...h,completed:!h.completed}:h));

 const startTask=(task:Task)=>{
  setFocusedTaskId(task.id);setSeconds(task.minutes*60);setRunning(false);setTab("Focus");
 };
 const startNext=()=>{if(next)startTask(next)};
 const finishFocused=()=>{if(focusedTaskId)setTasks(v=>v.map(t=>t.id===focusedTaskId?{...t,done:true}:t));setRunning(false);setFocusedTaskId(null);setSeconds(1500)};

 return <main className="shell">
  <aside className="side"><div className="brand"><b>F</b><span><strong>FocusOS</strong><small>Personal OS</small></span></div><nav>{navItems.map(([label,icon])=><button className={tab===label?"nav active":"nav"} key={label} onClick={()=>setTab(label)}><span className="navIcon">{icon}</span><em>{label}</em></button>)}</nav><div className="sidebox"><div className="sideboxTop"><small>TODAY</small><span>{pct}%</span></div><strong>{done}/{tasks.length} tasks</strong><div className="bar"><i style={{width:pct+"%"}}/></div></div></aside>

  <section className="content"><header><div><div className="eyebrow">SATURDAY, SEPTEMBER 26</div><h1>{tab==="Dashboard"?"Good morning.":tab}</h1>{tab==="Dashboard"&&<p className="headerSub">Let's make today feel manageable.</p>}</div><button className="avatar">CS</button></header>

  {tab==="Dashboard"&&<><div className="hero">
   <div className="card nextCard"><div className="cardLabelRow"><span className="eyebrow">NEXT UP</span>{next&&<PriorityPill priority={next.priority}/>}</div><h2>{next?.title||"Everything is done."}</h2><p>{next?<>A focused <strong>{next.minutes}-minute</strong> step is enough. You don't need to finish everything.</>:"Take a moment to review your day."}</p>{next&&<button className="primary" onClick={startNext}>Start focus <span>→</span></button>}<div className="nextMeta"><span>◷ {next?.minutes||0} min</span><span>•</span><span>{energy} energy</span><span>•</span><span>1 task at a time</span></div></div>
   <div className="card energyCard"><span className="eyebrow">ENERGY CHECK-IN</span><h3>How much capacity do you have?</h3><p>Your answer helps FocusOS choose the right next step.</p><div className="energies">{(["Low","Medium","High"] as const).map(x=><button className={energy===x?"energy selected":"energy"} key={x} onClick={()=>setEnergy(x)}><span>{x==="Low"?"○":x==="Medium"?"◐":"●"}</span>{x}</button>)}</div></div>
  </div>
  <div className="stats"><Stat icon="✓" label="Tasks complete" value={done+"/"+tasks.length} note={pct+"% of today"}/><Stat icon="↻" label="Habits" value={completedHabits+"/"+habits.length} note="daily check-in"/><Stat icon="◉" label="Focus streak" value="4 days" note="keep it simple"/><Stat icon="◷" label="Focus time" value="1h 20m" note="this week"/></div>

  <div className="quickAdd card"><span className="quickIcon">＋</span><input value={quickTask} onChange={e=>setQuickTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&quickAdd()} placeholder="Quick add — get something out of your head"/><button className="primary" onClick={quickAdd}>Add</button></div>

  <div className="sectionHeading"><div><span className="eyebrow">YOUR DAY</span><h3>Keep the list small.</h3></div><button className="textButton" onClick={()=>setTab("Tasks")}>View all tasks →</button></div>
  <div className="grid"><div className="card listCard"><div className="listHeader"><div><span className="eyebrow">TODAY</span><h3>Tasks</h3></div><span className="count">{done}/{tasks.length}</span></div>{tasks.map(t=><TaskRow key={t.id} t={t} check={()=>toggleTask(t.id)} open={()=>setSelectedTask(t)}/>)}</div>
   <div className="card listCard"><div className="listHeader"><div><span className="eyebrow">ROUTINE</span><h3>Habits</h3></div><span className="count">{completedHabits}/{habits.length}</span></div>{habits.map(h=><button className="habitRow" key={h.id} onClick={()=>toggleHabit(h.id)}><span className={h.completed?"check yes":"check"}>{h.completed?"✓":""}</span><span className={h.completed?"habitName completed":"habitName"}>{h.name}</span></button>)}<div className="habitFooter"><span>{completedHabits===habits.length?"All habits checked.":"One small action at a time."}</span><b>{completedHabits===habits.length?"✓":"→"}</b></div></div>
  </div><div className="dailyCallout"><span className="calloutIcon">✦</span><div><strong>Today's principle</strong><p>Reduce the starting friction. A 10-minute action still counts as progress.</p></div></div></>}

  {tab==="Tasks"&&<div className="card page"><div className="pageIntro"><span className="eyebrow">CAPTURE</span><h2>Task inbox</h2><p>Get everything out of your head. FocusOS will help you decide what comes next.</p></div><div className="add"><input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitTask()} placeholder="What needs to get done?"/><button className="primary" onClick={submitTask}>Add task</button></div><div className="taskList">{tasks.map(t=><TaskRow key={t.id} t={t} check={()=>toggleTask(t.id)} open={()=>setSelectedTask(t)}/>)}</div></div>}

  {tab==="Habits"&&<div className="card page"><div className="pageIntro"><span className="eyebrow">CONSISTENCY</span><h2>Daily habits</h2><p>Small actions compound. Check them off without overthinking them.</p></div>{habits.map(h=><button className="habitRow large" key={h.id} onClick={()=>toggleHabit(h.id)}><span className={h.completed?"check yes":"check"}>{h.completed?"✓":""}</span><span className={h.completed?"habitName completed":"habitName"}>{h.name}</span></button>)}</div>}

  {tab==="Goals"&&<div className="card page"><div className="pageIntro"><span className="eyebrow">DIRECTION</span><h2>Goals & milestones</h2><p>Turn bigger outcomes into visible, manageable progress.</p></div><Goal title="Launch FocusOS MVP" pct={62}/><Goal title="Build a consistent morning routine" pct={38}/></div>}

  {tab==="Focus"&&<div className="focus"><div className="focusCard card"><span className="eyebrow">FOCUS MODE</span><div className="focusRule">ONE TASK · ONE TIMER</div><h2>{focusedTask?.title||next?.title||"Choose one thing."}</h2><p>{focusedTask?<>This is your only task for the next {focusedTask.minutes} minutes.</>:"Pick one task from your list and start small."}</p><div className="timer">{mm}:{ss}</div><div className="timerActions">{focusedTask&&<button className="secondary" onClick={()=>setSelectedTask(focusedTask)}>Edit task</button>}<button className="primary focusStart" onClick={()=>focusedTask?setRunning(!running):startNext()}>{running?"Pause":focusedTask?"Start focus":"Choose next"} <span>{running?"Ⅱ":"▶"}</span></button>{focusedTask&&<button className="secondary" onClick={finishFocused}>Finish task</button>}</div><div className="focusFooter"><span>◌ Notifications off</span><span>◌ One task only</span><span>◌ No pressure to finish</span></div></div></div>}
  </section>

  {selectedTask&&<TaskModal task={selectedTask} onClose={()=>setSelectedTask(null)} onSave={saveTask} onDelete={deleteTask} onFocus={()=>{startTask(selectedTask);setSelectedTask(null)}}/>}
 </main>;
}

function Stat({icon,label,value,note}:{icon:string;label:string;value:string;note:string}){return <div className="card stat"><div className="statTop"><span className="statIcon">{icon}</span><span className="eyebrow">{label}</span></div><strong>{value}</strong><span className="statNote">{note}</span></div>}
function PriorityPill({priority}:{priority:Priority}){return <span className={"prio "+priority.toLowerCase()}>{priority} priority</span>}
function TaskRow({t,check,open}:{t:Task;check:()=>void;open:()=>void}){return <div className={"taskRow "+(t.done?"isDone":"")}><button className={t.done?"check yes":"check"} onClick={check} aria-label={t.done?"Mark incomplete":"Mark complete"}>{t.done?"✓":""}</button><button className="taskOpen" onClick={open}><span className="taskTitle">{t.title}</span><span className={"prio "+t.priority.toLowerCase()}>{t.priority}</span><small>{t.minutes}m</small></button></div>}
function Goal({title,pct}:{title:string;pct:number}){return <div className="goal"><div className="goalTop"><strong>{title}</strong><b>{pct}%</b></div><div className="bar"><i style={{width:pct+"%"}}/></div></div>}

function TaskModal({task,onClose,onSave,onDelete,onFocus}:{task:Task;onClose:()=>void;onSave:(task:Task)=>void;onDelete:(id:number)=>void;onFocus:()=>void}){
 const [draft,setDraft]=useState(task);
 return <div className="modalBackdrop" onMouseDown={onClose}><div className="modal card" onMouseDown={e=>e.stopPropagation()}>
  <div className="modalHeader"><div><span className="eyebrow">TASK</span><h3>Edit task</h3></div><button className="modalClose" onClick={onClose}>×</button></div>
  <label>Task name<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
  <div className="formGrid"><label>Priority<select value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value as Priority})}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Minutes<input type="number" min="5" step="5" value={draft.minutes} onChange={e=>setDraft({...draft,minutes:Math.max(5,Number(e.target.value)||5)})}/></label></div>
  <div className="modalActions"><button className="dangerButton" onClick={()=>onDelete(task.id)}>Delete</button><div><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" onClick={()=>onSave(draft)}>Save changes</button><button className="primary" onClick={onFocus}>Start focus</button></div></div>
 </div></div>
}
