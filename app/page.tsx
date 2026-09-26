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
 const [tab,setTab]=useState("Dashboard"),[energy,setEnergy]=useState<"Low"|"Medium"|"High">("Medium"),[tasks,setTasks]=useState<Task[]>(seedTasks),[habits,setHabits]=useState<Habit[]>(seedHabits),[newTask,setNewTask]=useState(""),[seconds,setSeconds]=useState(1500),[running,setRunning]=useState(false);
 useEffect(()=>{try{const s=JSON.parse(localStorage.getItem("focusos")||"{}");if(s.tasks)setTasks(s.tasks);if(s.habits)setHabits(s.habits);if(s.energy)setEnergy(s.energy)}catch{}},[]);
 useEffect(()=>{localStorage.setItem("focusos",JSON.stringify({tasks,habits,energy}))},[tasks,habits,energy]);
 useEffect(()=>{if(!running)return;const timer=setInterval(()=>setSeconds(v=>{if(v<=1){setRunning(false);return 1500}return v-1}),1000);return()=>clearInterval(timer)},[running]);
 const done=tasks.filter(t=>t.done).length,pct=tasks.length?Math.round(done/tasks.length*100):0,completedHabits=habits.filter(h=>h.completed).length;
 const next=useMemo(()=>tasks.find(t=>!t.done&&t.priority==="High")||tasks.find(t=>!t.done),[tasks]);
 const mm=String(Math.floor(seconds/60)).padStart(2,"0"),ss=String(seconds%60).padStart(2,"0");
 const addTask=()=>{const title=newTask.trim();if(!title)return;setTasks(v=>[...v,{id:Date.now(),title,done:false,priority:"Medium",minutes:20}]);setNewTask("")};
 const toggleTask=(id:number)=>setTasks(v=>v.map(t=>t.id===id?{...t,done:!t.done}:t));
 const toggleHabit=(id:number)=>setHabits(v=>v.map(h=>h.id===id?{...h,completed:!h.completed}:h));
 const startNext=()=>{if(next){setTab("Focus");setRunning(false);setSeconds(next.minutes*60)}};
 return <main className="shell">
  <aside className="side"><div className="brand"><b>F</b><span><strong>FocusOS</strong><small>Personal OS</small></span></div><nav>{navItems.map(([label,icon])=><button className={tab===label?"nav active":"nav"} key={label} onClick={()=>setTab(label)}><span className="navIcon">{icon}</span><em>{label}</em></button>)}</nav><div className="sidebox"><div className="sideboxTop"><small>TODAY</small><span>{pct}%</span></div><strong>{done}/{tasks.length} tasks</strong><div className="bar"><i style={{width:pct+"%"}}/></div></div></aside>
  <section className="content"><header><div><div className="eyebrow">SATURDAY, SEPTEMBER 26</div><h1>{tab==="Dashboard"?"Good morning.":tab}</h1>{tab==="Dashboard"&&<p className="headerSub">Let's make today feel manageable.</p>}</div><button className="avatar">CS</button></header>
  {tab==="Dashboard"&&<><div className="hero">
   <div className="card nextCard"><div className="cardLabelRow"><span className="eyebrow">NEXT UP</span>{next&&<PriorityPill priority={next.priority}/>}</div><h2>{next?.title||"Everything is done."}</h2><p>{next?<>A focused <strong>{next.minutes}-minute</strong> step is enough. You don't need to finish everything.</>:"Take a moment to review your day."}</p>{next&&<button className="primary" onClick={startNext}>Start focus <span>→</span></button>}<div className="nextMeta"><span>◷ {next?.minutes||0} min</span><span>•</span><span>{energy} energy</span><span>•</span><span>1 task at a time</span></div></div>
   <div className="card energyCard"><span className="eyebrow">ENERGY CHECK-IN</span><h3>How much capacity do you have?</h3><p>Your answer helps FocusOS choose the right next step.</p><div className="energies">{(["Low","Medium","High"] as const).map(x=><button className={energy===x?"energy selected":"energy"} key={x} onClick={()=>setEnergy(x)}><span>{x==="Low"?"○":x==="Medium"?"◐":"●"}</span>{x}</button>)}</div></div>
  </div>
  <div className="stats"><Stat icon="✓" label="Tasks complete" value={done+"/"+tasks.length} note={pct+"% of today"}/><Stat icon="↻" label="Habits" value={completedHabits+"/"+habits.length} note="daily check-in"/><Stat icon="◉" label="Focus streak" value="4 days" note="keep it simple"/><Stat icon="◷" label="Focus time" value="1h 20m" note="this week"/></div>
  <div className="sectionHeading"><div><span className="eyebrow">YOUR DAY</span><h3>Keep the list small.</h3></div><button className="textButton" onClick={()=>setTab("Tasks")}>View all tasks →</button></div>
  <div className="grid"><div className="card listCard"><div className="listHeader"><div><span className="eyebrow">TODAY</span><h3>Tasks</h3></div><span className="count">{done}/{tasks.length}</span></div>{tasks.map(t=><TaskRow key={t.id} t={t} click={()=>toggleTask(t.id)}/>)}</div>
   <div className="card listCard"><div className="listHeader"><div><span className="eyebrow">ROUTINE</span><h3>Habits</h3></div><span className="count">{completedHabits}/{habits.length}</span></div>{habits.map(h=><button className="habitRow" key={h.id} onClick={()=>toggleHabit(h.id)}><span className={h.completed?"check yes":"check"}>{h.completed?"✓":""}</span><span className={h.completed?"habitName completed":"habitName"}>{h.name}</span><span className="rowArrow">›</span></button>)}<div className="habitFooter"><span>{completedHabits===habits.length?"All habits checked.":"One small action at a time."}</span><b>{completedHabits===habits.length?"✓":"→"}</b></div></div>
  </div><div className="dailyCallout"><span className="calloutIcon">✦</span><div><strong>Today's principle</strong><p>Reduce the starting friction. A 10-minute action still counts as progress.</p></div></div></>}
  {tab==="Tasks"&&<div className="card page"><div className="pageIntro"><span className="eyebrow">CAPTURE</span><h2>Task inbox</h2><p>Get everything out of your head. FocusOS will help you decide what comes next.</p></div><div className="add"><input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()} placeholder="What needs to get done?"/><button className="primary" onClick={addTask}>Add task</button></div><div className="taskList">{tasks.map(t=><TaskRow key={t.id} t={t} click={()=>toggleTask(t.id)}/>)}</div></div>}
  {tab==="Habits"&&<div className="card page"><div className="pageIntro"><span className="eyebrow">CONSISTENCY</span><h2>Daily habits</h2><p>Small actions compound. Check them off without overthinking them.</p></div>{habits.map(h=><button className="habitRow large" key={h.id} onClick={()=>toggleHabit(h.id)}><span className={h.completed?"check yes":"check"}>{h.completed?"✓":""}</span><span className={h.completed?"habitName completed":"habitName"}>{h.name}</span><span className="rowArrow">›</span></button>)}</div>}
  {tab==="Goals"&&<div className="card page"><div className="pageIntro"><span className="eyebrow">DIRECTION</span><h2>Goals & milestones</h2><p>Turn bigger outcomes into visible, manageable progress.</p></div><Goal title="Launch FocusOS MVP" pct={62}/><Goal title="Build a consistent morning routine" pct={38}/></div>}
  {tab==="Focus"&&<div className="focus"><div className="focusCard card"><span className="eyebrow">FOCUS MODE</span><div className="focusRule">ONE TASK · ONE TIMER</div><h2>{next?.title||"Choose one thing."}</h2><p>Put everything else aside. You can come back to it later.</p><div className="timer">{mm}:{ss}</div><div className="timerActions"><button className="primary focusStart" onClick={()=>setRunning(!running)}>{running?"Pause":"Start focus"} <span>{running?"Ⅱ":"▶"}</span></button><button className="secondary" onClick={()=>{setRunning(false);setSeconds(next?next.minutes*60:1500)}}>Reset</button></div><div className="focusFooter"><span>◌ Notifications off</span><span>◌ One task only</span><span>◌ No pressure to finish</span></div></div></div>}
  </section></main>;
}
function Stat({icon,label,value,note}:{icon:string;label:string;value:string;note:string}){return <div className="card stat"><div className="statTop"><span className="statIcon">{icon}</span><span className="eyebrow">{label}</span></div><strong>{value}</strong><span className="statNote">{note}</span></div>}
function PriorityPill({priority}:{priority:Priority}){return <span className={"prio "+priority.toLowerCase()}>{priority} priority</span>}
function TaskRow({t,click}:{t:Task;click:()=>void}){return <button className={"taskRow "+(t.done?"isDone":"")} onClick={click}><span className={t.done?"check yes":"check"}>{t.done?"✓":""}</span><span className="taskTitle">{t.title}</span><span className={"prio "+t.priority.toLowerCase()}>{t.priority}</span><small>{t.minutes}m</small></button>}
function Goal({title,pct}:{title:string;pct:number}){return <div className="goal"><div className="goalTop"><strong>{title}</strong><b>{pct}%</b></div><div className="bar"><i style={{width:pct+"%"}}/></div></div>}
