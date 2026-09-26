"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Priority="Low"|"Medium"|"High";
type Task={id:string;title:string;done:boolean;priority:Priority;minutes:number};
type Habit={id:string;name:string;completed:boolean};
type Goal={id:string;title:string;progress:number};

const seedTasks:Task[]=[
{id:"seed-1",title:"Review today's priorities",done:false,priority:"High",minutes:10},
{id:"seed-2",title:"Finish FocusOS landing page",done:false,priority:"High",minutes:45},
{id:"seed-3",title:"Reply to important messages",done:false,priority:"Medium",minutes:20},
{id:"seed-4",title:"Plan tomorrow",done:false,priority:"Low",minutes:10},
{id:"seed-5",title:"Send an email",done:false,priority:"Medium",minutes:20}];
const seedHabits:Habit[]=[
{id:"seed-h1",name:"Drink water",completed:true},{id:"seed-h2",name:"10-minute walk",completed:false},{id:"seed-h3",name:"Read / learn",completed:false}];
const seedGoals:Goal[]=[{id:"seed-g1",title:"Launch FocusOS MVP",progress:62},{id:"seed-g2",title:"Build a consistent morning routine",progress:38}];
const navItems=[["Dashboard","⌂"],["Tasks","✓"],["Habits","↻"],["Goals","◎"],["Focus","◉"]] as const;

function FocusOSApp({userId}:{userId:string}){
 const [tab,setTab]=useState("Dashboard"),[energy,setEnergy]=useState<"Low"|"Medium"|"High">("Medium"),[tasks,setTasks]=useState<Task[]>(seedTasks),[habits,setHabits]=useState<Habit[]>(seedHabits),[goals,setGoals]=useState<Goal[]>(seedGoals),[newTask,setNewTask]=useState(""),[seconds,setSeconds]=useState(1500),[running,setRunning]=useState(false),[focusedTaskId,setFocusedTaskId]=useState<string|null>(null),[selectedTask,setSelectedTask]=useState<Task|null>(null),[quickTask,setQuickTask]=useState(""),[focusSessionId,setFocusSessionId]=useState<string|null>(null),[focusElapsed,setFocusElapsed]=useState(0),[todayFocus,setTodayFocus]=useState(0),[weekFocus,setWeekFocus]=useState(0),[focusStreak,setFocusStreak]=useState(0);

 useEffect(()=>{try{const s=JSON.parse(localStorage.getItem("focusos")||"{}");if(s.tasks)setTasks(s.tasks);if(s.habits)setHabits(s.habits);if(s.goals)setGoals(s.goals);if(s.energy)setEnergy(s.energy)}catch{}},[]);

 useEffect(()=>{
  let cancelled=false;
  const loadTasks=async()=>{
   if(!supabase)return;
   const {data,error}=await supabase.from("tasks").select("id,title,done,priority,minutes").eq("user_id",userId).order("created_at",{ascending:true});
   if(cancelled||error)return;
   if(data&&data.length){
    setTasks(data as Task[]);
    return;
   }
   let cached:Task[]=[];
   try{const s=JSON.parse(localStorage.getItem("focusos")||"{}");if(Array.isArray(s.tasks))cached=s.tasks}catch{}
   const source=cached.length?cached:seedTasks;
   const rows=source.map(t=>({user_id:userId,title:t.title,done:t.done,priority:t.priority,minutes:t.minutes}));
   const {data:inserted}=await supabase.from("tasks").insert(rows).select("id,title,done,priority,minutes").order("created_at",{ascending:true});
   if(!cancelled&&inserted)setTasks(inserted as Task[]);
  };
  loadTasks();
  return()=>{cancelled=true};
 },[userId]);
 useEffect(()=>{localStorage.setItem("focusos",JSON.stringify({tasks,habits,goals,energy}))},[tasks,habits,goals,energy]);

 useEffect(()=>{
  let cancelled=false;
  const loadWorkspace=async()=>{
   if(!supabase)return;
   const [habitsResult,goalsResult]=await Promise.all([
    supabase.from("habits").select("id,name,completed").eq("user_id",userId).order("created_at",{ascending:true}),
    supabase.from("goals").select("id,title,progress").eq("user_id",userId).order("created_at",{ascending:true})
   ]);
   if(cancelled)return;
   if(habitsResult.data?.length)setHabits(habitsResult.data as Habit[]);
   else{
    const rows=seedHabits.map(h=>({user_id:userId,name:h.name,completed:h.completed}));
    const {data}=await supabase.from("habits").insert(rows).select("id,name,completed").order("created_at",{ascending:true});
    if(data)setHabits(data as Habit[]);
   }
   if(goalsResult.data?.length)setGoals(goalsResult.data as Goal[]);
   else{
    const rows=seedGoals.map(g=>({user_id:userId,title:g.title,progress:g.progress}));
    const {data}=await supabase.from("goals").insert(rows).select("id,title,progress").order("created_at",{ascending:true});
    if(data)setGoals(data as Goal[]);
   }
  };
  loadWorkspace();
  return()=>{cancelled=true};
 },[userId]);

 useEffect(()=>{
  let cancelled=false;
  const loadFocusStats=async()=>{
   if(!supabase)return;
   const now=new Date();
   const todayStart=new Date(now);todayStart.setHours(0,0,0,0);
   const weekStart=new Date(todayStart);weekStart.setDate(weekStart.getDate()-6);
   const historyStart=new Date(todayStart);historyStart.setDate(historyStart.getDate()-30);
   const {data,error}=await supabase.from("focus_sessions").select("duration_seconds,completed,started_at,ended_at").eq("user_id",userId).eq("completed",true).gte("started_at",historyStart.toISOString());
   if(cancelled||error)return;
   const rows=data||[];
   let today=0,week=0;
   const days=new Set<string>();
   rows.forEach((row:any)=>{
    const started=new Date(row.started_at);
    const duration=Number(row.duration_seconds)||0;
    if(started>=todayStart)today+=duration;
    if(started>=weekStart)week+=duration;
    days.add(started.toLocaleDateString("en-CA"));
   });
   let streak=0;
   const cursor=new Date(todayStart);
   while(days.has(cursor.toLocaleDateString("en-CA"))){streak++;cursor.setDate(cursor.getDate()-1);}
   setTodayFocus(today);setWeekFocus(week);setFocusStreak(streak);
  };
  loadFocusStats();
  return()=>{cancelled=true};
 },[userId,focusSessionId]);

 useEffect(()=>{
  if(!running)return;
  const timer=setInterval(()=>{
   setSeconds(v=>v>0?v-1:0);
   setFocusElapsed(v=>v+1);
  },1000);
  return()=>clearInterval(timer);
 },[running]);

 useEffect(()=>{
  if(!running||seconds!==0)return;
  setRunning(false);
  void completeFocusSession(focusElapsed+1,true);
 },[seconds,running]);

 const done=tasks.filter(t=>t.done).length,pct=tasks.length?Math.round(done/tasks.length*100):0,completedHabits=habits.filter(h=>h.completed).length;
 const next=useMemo(()=>tasks.find(t=>!t.done&&t.priority==="High")||tasks.find(t=>!t.done),[tasks]);
 const focusedTask=focusedTaskId?tasks.find(t=>t.id===focusedTaskId):null;
 const mm=String(Math.floor(seconds/60)).padStart(2,"0"),ss=String(seconds%60).padStart(2,"0");
 const formatFocusTime=(value:number)=>{const h=Math.floor(value/3600),m=Math.floor((value%3600)/60);return h?String(h)+"h "+String(m).padStart(2,"0")+"m":m+"m"};

 const addTask=async(title:string,priority:Priority="Medium",minutes=20)=>{
  const clean=title.trim();if(!clean)return;
  if(supabase){
   const {data,error}=await supabase.from("tasks").insert({user_id:userId,title:clean,done:false,priority,minutes}).select("id,title,done,priority,minutes").single();
   if(!error&&data){setTasks(v=>[...v,data as Task]);return}
  }
  setTasks(v=>[...v,{id:String(Date.now()+Math.floor(Math.random()*1000)),title:clean,done:false,priority,minutes}]);
 };
 const submitTask=()=>{addTask(newTask);setNewTask("")};
 const quickAdd=()=>{addTask(quickTask);setQuickTask("")};
 const toggleTask=async(id:string)=>{
  const task=tasks.find(t=>t.id===id);if(!task)return;
  const done=!task.done;setTasks(v=>v.map(t=>t.id===id?{...t,done}:t));
  if(supabase)await supabase.from("tasks").update({done}).eq("id",id).eq("user_id",userId);
 };
 const deleteTask=async(id:string)=>{
  setTasks(v=>v.filter(t=>t.id!==id));if(selectedTask?.id===id)setSelectedTask(null);
  if(supabase)await supabase.from("tasks").delete().eq("id",id).eq("user_id",userId);
 };
 const saveTask=async(updated:Task)=>{
  setTasks(v=>v.map(t=>t.id===updated.id?updated:t));setSelectedTask(null);
  if(supabase)await supabase.from("tasks").update({title:updated.title,priority:updated.priority,minutes:updated.minutes,done:updated.done}).eq("id",updated.id).eq("user_id",userId);
 };
 const toggleHabit=async(id:string)=>{
  const habit=habits.find(h=>h.id===id);if(!habit)return;
  const completed=!habit.completed;setHabits(v=>v.map(h=>h.id===id?{...h,completed}:h));
  if(supabase)await supabase.from("habits").update({completed}).eq("id",id).eq("user_id",userId);
 };

 const startTask=(task:Task)=>{
  setFocusedTaskId(task.id);setSeconds(task.minutes*60);setFocusElapsed(0);setFocusSessionId(null);setRunning(false);setTab("Focus");
 };
 const startNext=()=>{if(next)startTask(next)};
 const startFocus=async()=>{
  if(!focusedTaskId)return;
  if(focusSessionId){setRunning(true);return}
  if(supabase){
   const {data,error}=await supabase.from("focus_sessions").insert({user_id:userId,task_id:focusedTaskId,duration_seconds:0,completed:false,started_at:new Date().toISOString()}).select("id").single();
   if(error||!data)return;
   setFocusSessionId(data.id);
  }
  setRunning(true);
 };
 const updateFocusSession=async(duration:number,completed:boolean)=>{
  if(!supabase||!focusSessionId)return;
  await supabase.from("focus_sessions").update({duration_seconds:duration,completed,ended_at:completed?new Date().toISOString():null}).eq("id",focusSessionId).eq("user_id",userId);
 };
 const completeFocusSession=async(duration:number,completed:boolean)=>{
  await updateFocusSession(duration,completed);
  if(completed&&focusedTaskId){
   setTasks(v=>v.map(t=>t.id===focusedTaskId?{...t,done:true}:t));
   if(supabase)void supabase.from("tasks").update({done:true}).eq("id",focusedTaskId).eq("user_id",userId);
  }
  setFocusSessionId(null);setFocusedTaskId(null);setFocusElapsed(0);setSeconds(1500);
 };
 const pauseFocus=async()=>{
  setRunning(false);
  await updateFocusSession(focusElapsed,false);
 };
 const stopFocus=async()=>{
  setRunning(false);
  await completeFocusSession(focusElapsed,false);
 };
 const finishFocused=async()=>{
  setRunning(false);
  await completeFocusSession(focusElapsed,true);
 };

 return <main className="shell">
  <aside className="side"><div className="brand"><b>F</b><span><strong>FocusOS</strong><small>Personal OS</small></span></div><nav>{navItems.map(([label,icon])=><button className={tab===label?"nav active":"nav"} key={label} onClick={()=>setTab(label)}><span className="navIcon">{icon}</span><em>{label}</em></button>)}</nav><div className="sidebox"><div className="sideboxTop"><small>TODAY</small><span>{pct}%</span></div><strong>{done}/{tasks.length} tasks</strong><div className="bar"><i style={{width:pct+"%"}}/></div></div></aside>

  <section className="content"><header><div><div className="eyebrow">SATURDAY, SEPTEMBER 26</div><h1>{tab==="Dashboard"?"Good morning.":tab}</h1>{tab==="Dashboard"&&<p className="headerSub">Let's make today feel manageable.</p>}</div><button className="avatar" onClick={()=>supabase?.auth.signOut()} title="Sign out">CS</button></header>

  {tab==="Dashboard"&&<><div className="hero">
   <div className="card nextCard"><div className="cardLabelRow"><span className="eyebrow">NEXT UP</span>{next&&<PriorityPill priority={next.priority}/>}</div><h2>{next?.title||"Everything is done."}</h2><p>{next?<>A focused <strong>{next.minutes}-minute</strong> step is enough. You don't need to finish everything.</>:"Take a moment to review your day."}</p>{next&&<button className="primary" onClick={startNext}>Start focus <span>→</span></button>}<div className="nextMeta"><span>◷ {next?.minutes||0} min</span><span>•</span><span>{energy} energy</span><span>•</span><span>1 task at a time</span></div></div>
   <div className="card energyCard"><span className="eyebrow">ENERGY CHECK-IN</span><h3>How much capacity do you have?</h3><p>Your answer helps FocusOS choose the right next step.</p><div className="energies">{(["Low","Medium","High"] as const).map(x=><button className={energy===x?"energy selected":"energy"} key={x} onClick={()=>setEnergy(x)}><span>{x==="Low"?"○":x==="Medium"?"◐":"●"}</span>{x}</button>)}</div></div>
  </div>
  <div className="stats"><Stat icon="✓" label="Tasks complete" value={done+"/"+tasks.length} note={pct+"% of today"}/><Stat icon="↻" label="Habits" value={completedHabits+"/"+habits.length} note="daily check-in"/><Stat icon="◉" label="Focus streak" value={focusStreak+" days"} note="completed sessions"/><Stat icon="◷" label="Focus time" value={formatFocusTime(weekFocus)} note="this week"/></div>

  <div className="quickAdd card"><span className="quickIcon">＋</span><input value={quickTask} onChange={e=>setQuickTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&quickAdd()} placeholder="Quick add — get something out of your head"/><button className="primary" onClick={quickAdd}>Add</button></div>

  <div className="sectionHeading"><div><span className="eyebrow">YOUR DAY</span><h3>Keep the list small.</h3></div><button className="textButton" onClick={()=>setTab("Tasks")}>View all tasks →</button></div>
  <div className="grid"><div className="card listCard"><div className="listHeader"><div><span className="eyebrow">TODAY</span><h3>Tasks</h3></div><span className="count">{done}/{tasks.length}</span></div>{tasks.map(t=><TaskRow key={t.id} t={t} check={()=>toggleTask(t.id)} open={()=>setSelectedTask(t)}/>)}</div>
   <div className="card listCard"><div className="listHeader"><div><span className="eyebrow">ROUTINE</span><h3>Habits</h3></div><span className="count">{completedHabits}/{habits.length}</span></div>{habits.map(h=><button className="habitRow" key={h.id} onClick={()=>toggleHabit(h.id)}><span className={h.completed?"check yes":"check"}>{h.completed?"✓":""}</span><span className={h.completed?"habitName completed":"habitName"}>{h.name}</span></button>)}<div className="habitFooter"><span>{completedHabits===habits.length?"All habits checked.":"One small action at a time."}</span><b>{completedHabits===habits.length?"✓":"→"}</b></div></div>
  </div><div className="dailyCallout"><span className="calloutIcon">✦</span><div><strong>Today's principle</strong><p>Reduce the starting friction. A 10-minute action still counts as progress.</p></div></div></>}

  {tab==="Tasks"&&<div className="card page"><div className="pageIntro"><span className="eyebrow">CAPTURE</span><h2>Task inbox</h2><p>Get everything out of your head. FocusOS will help you decide what comes next.</p></div><div className="add"><input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitTask()} placeholder="What needs to get done?"/><button className="primary" onClick={submitTask}>Add task</button></div><div className="taskList">{tasks.map(t=><TaskRow key={t.id} t={t} check={()=>toggleTask(t.id)} open={()=>setSelectedTask(t)}/>)}</div></div>}

  {tab==="Habits"&&<div className="card page"><div className="pageIntro"><span className="eyebrow">CONSISTENCY</span><h2>Daily habits</h2><p>Small actions compound. Check them off without overthinking them.</p></div>{habits.map(h=><button className="habitRow large" key={h.id} onClick={()=>toggleHabit(h.id)}><span className={h.completed?"check yes":"check"}>{h.completed?"✓":""}</span><span className={h.completed?"habitName completed":"habitName"}>{h.name}</span></button>)}</div>}

  {tab==="Goals"&&<div className="card page"><div className="pageIntro"><span className="eyebrow">DIRECTION</span><h2>Goals & milestones</h2><p>Turn bigger outcomes into visible, manageable progress.</p></div>{goals.map(g=><Goal key={g.id} title={g.title} pct={g.progress}/>)}</div>}

  {tab==="Focus"&&<div className="focus"><div className="focusCard card"><span className="eyebrow">FOCUS MODE</span><div className="focusRule">ONE TASK · ONE TIMER</div><h2>{focusedTask?.title||next?.title||"Choose one thing."}</h2><p>{focusedTask?<>This is your only task for the next {focusedTask.minutes} minutes.</>:"Pick one task from your list and start small."}</p><div className="timer">{mm}:{ss}</div><div className="timerActions">{focusedTask&&<button className="secondary" onClick={()=>setSelectedTask(focusedTask)}>Edit task</button>}<button className="primary focusStart" onClick={()=>focusedTask?(running?pauseFocus():startFocus()):startNext()}>{running?"Pause":"Start focus"} <span>{running?"Ⅱ":"▶"}</span></button>{focusedTask&&<button className="secondary" onClick={finishFocused}>Finish task</button>}{focusedTask&&focusSessionId&&<button className="secondary" onClick={stopFocus}>Stop session</button>}</div><div className="focusFooter"><span>◌ Today {formatFocusTime(todayFocus)}</span><span>◌ This week {formatFocusTime(weekFocus)}</span><span>◌ {focusElapsed}s current session</span></div></div></div>}
  </section>

  {selectedTask&&<TaskModal task={selectedTask} onClose={()=>setSelectedTask(null)} onSave={saveTask} onDelete={deleteTask} onFocus={()=>{startTask(selectedTask);setSelectedTask(null)}}/>}
 </main>;
}

function Stat({icon,label,value,note}:{icon:string;label:string;value:string;note:string}){return <div className="card stat"><div className="statTop"><span className="statIcon">{icon}</span><span className="eyebrow">{label}</span></div><strong>{value}</strong><span className="statNote">{note}</span></div>}
function PriorityPill({priority}:{priority:Priority}){return <span className={"prio "+priority.toLowerCase()}>{priority} priority</span>}
function TaskRow({t,check,open}:{t:Task;check:()=>void;open:()=>void}){return <div className={"taskRow "+(t.done?"isDone":"")}><button className={t.done?"check yes":"check"} onClick={check} aria-label={t.done?"Mark incomplete":"Mark complete"}>{t.done?"✓":""}</button><button className="taskOpen" onClick={open}><span className="taskTitle">{t.title}</span><span className={"prio "+t.priority.toLowerCase()}>{t.priority}</span><small>{t.minutes}m</small></button></div>}
function Goal({title,pct}:{title:string;pct:number}){return <div className="goal"><div className="goalTop"><strong>{title}</strong><b>{pct}%</b></div><div className="bar"><i style={{width:pct+"%"}}/></div></div>}

function TaskModal({task,onClose,onSave,onDelete,onFocus}:{task:Task;onClose:()=>void;onSave:(task:Task)=>void;onDelete:(id:string)=>void;onFocus:()=>void}){
 const [draft,setDraft]=useState(task);
 return <div className="modalBackdrop" onMouseDown={onClose}><div className="modal card" onMouseDown={e=>e.stopPropagation()}>
  <div className="modalHeader"><div><span className="eyebrow">TASK</span><h3>Edit task</h3></div><button className="modalClose" onClick={onClose}>×</button></div>
  <label>Task name<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
  <div className="formGrid"><label>Priority<select value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value as Priority})}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Minutes<input type="number" min="5" step="5" value={draft.minutes} onChange={e=>setDraft({...draft,minutes:Math.max(5,Number(e.target.value)||5)})}/></label></div>
  <div className="modalActions"><button className="dangerButton" onClick={()=>onDelete(task.id)}>Delete</button><div><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" onClick={()=>onSave(draft)}>Save changes</button><button className="primary" onClick={onFocus}>Start focus</button></div></div>
 </div></div>
}


export default function Home(){
 const [session,setSession]=useState<any>(undefined);
 const [authMode,setAuthMode]=useState<"login"|"signup">("login");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");

 useEffect(()=>{
  if(!supabase){setSession(null);return;}
  supabase.auth.getSession().then(({data})=>setSession(data.session));
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
  return()=>subscription.unsubscribe();
 },[]);

 if(!supabase) return <FocusOSApp userId={session.user.id}/>;

 if(session===undefined) return <div className="authShell"><div className="authCard card"><div className="brand authBrand"><b>F</b><span><strong>FocusOS</strong><small>Personal OS</small></span></div><p>Loading your workspace…</p></div></div>;

 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();setLoading(true);setError("");setMessage("");
  if (!supabase) { setError("Supabase is not configured."); setLoading(false); return; }
  const result=authMode==="login"
   ? await supabase.auth.signInWithPassword({email,password})
   : await supabase.auth.signUp({email,password});
  if(result.error)setError(result.error.message);
  else if(authMode==="signup" && !result.data.session)setMessage("Account created. Check your email if confirmation is required.");
  setLoading(false);
 };
 if(!session) return <main className="authShell"><div className="authCard card">
  <div className="brand authBrand"><b>F</b><span><strong>FocusOS</strong><small>Personal OS</small></span></div>
  <span className="eyebrow">{authMode==="login"?"WELCOME BACK":"GET STARTED"}</span>
  <h1>{authMode==="login"?"Sign in to FocusOS":"Create your FocusOS account"}</h1>
  <p className="authIntro">{authMode==="login"?"Your tasks, habits and focus sessions stay synced across devices.":"Create an account to sync your FocusOS workspace across devices."}</p>
  <form onSubmit={submit} className="authForm">
   <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
   <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} autoComplete={authMode==="login"?"current-password":"new-password"}/></label>
   {error&&<div className="authError">{error}</div>}
   {message&&<div className="authMessage">{message}</div>}
   <button className="primary authSubmit" disabled={loading}>{loading?"Please wait…":authMode==="login"?"Sign in":"Create account"}</button>
  </form>
  <button className="authSwitch" onClick={()=>{setAuthMode(authMode==="login"?"signup":"login");setError("");setMessage("")}}>
   {authMode==="login"?"Don't have an account? Create one":"Already have an account? Sign in"}
  </button>
 </div></main>;
 return <FocusOSApp userId={session.user.id}/>;
}
