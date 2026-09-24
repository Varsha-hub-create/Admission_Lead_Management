import React, { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, Link, useNavigate, useParams } from 'react-router-dom'
import api from './api'

const statuses = ['New','Contacted','Qualified','Counselling Scheduled','Application Started','Application Submitted','Converted','Not Interested','Lost','Deferred']
const sources = ['Website','Walk-in','Phone','WhatsApp','Fair','Campaign','Referral','Other']
const courses = ['B.Tech Computer Science','B.Tech IT','B.Tech AI & DS','BCA','MCA','MBA','M.Tech AI','B.Sc Data Science','B.Com','BBA']

function Protected({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />
}

function Layout({ children }) {
  const nav = useNavigate()
  const logout = () => { localStorage.clear(); nav('/login') }
  return <div className="app">
    <aside>
      <div className="brand">Admission_Lead<span>+</span></div>
      <div className="subbrand">Admission CRM</div>
      <nav>
        <Link to="/">Dashboard</Link>
        <Link to="/leads">All Leads</Link>
        <Link to="/leads/new">Add Lead</Link>
      </nav>
      <button className="logout" onClick={logout}>Sign out</button>
    </aside>
    <main>{children}</main>
  </div>
}

function Login() {
  const nav = useNavigate()
  const [form, setForm] = useState({ email:'admin@edumerge.local', password:'Admin@123' })
  const [error, setError] = useState('')
  async function submit(e) {
    e.preventDefault(); setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      nav('/')
    } catch (e) { setError(e.response?.data?.message || 'Login failed') }
  }
  return <div className="login-page">
    <form className="login-card" onSubmit={submit}>
      <div className="brand">EduMerge<span>+</span></div>
      <h1>Admission Lead Management</h1>
      <p>Sign in to manage enquiries, follow-ups and conversions.</p>
      {error && <div className="error">{error}</div>}
      <label>Email<input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
      <label>Password<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
      <button className="primary">Sign in</button>
      <small>Demo: admin@edumerge.local / Admin@123</small>
    </form>
  </div>
}

function Dashboard() {
  const [data,setData] = useState(null)
  useEffect(()=>{ api.get('/dashboard/summary').then(r=>setData(r.data)) },[])
  if (!data) return <Layout><div className="loading">Loading dashboard…</div></Layout>
  return <Layout>
    <Header title="Admission Dashboard" action={<Link className="primary btn" to="/leads/new">+ Add Lead</Link>}/>
    <section className="cards">
      <Metric label="Total Leads" value={data.total}/>
      <Metric label="Converted" value={data.converted}/>
      <Metric label="Conversion Rate" value={`${data.conversionRate}%`}/>
      <Metric label="Follow-ups Due" value={data.dueToday}/>
      <Metric label="Overdue" value={data.overdue} danger/>
      <Metric label="Conversion Value" value={`₹${Number(data.conversionValue).toLocaleString('en-IN')}`}/>
    </section>
    <div className="grid2">
      <section className="panel"><h2>Lifecycle</h2><Bars map={data.statusMap}/></section>
      <section className="panel"><h2>Lead Sources</h2><Bars map={data.sourceMap}/></section>
    </div>
    <section className="panel"><h2>Management Focus</h2>
      <div className="insights">
        <div><b>{data.overdue}</b><span>overdue follow-ups need attention</span></div>
        <div><b>{data.dueToday}</b><span>follow-ups scheduled today</span></div>
        <div><b>{data.conversionRate}%</b><span>of current leads are converted</span></div>
      </div>
    </section>
  </Layout>
}

function Metric({label,value,danger}) { return <div className={`metric ${danger?'danger':''}`}><span>{label}</span><strong>{value}</strong></div> }
function Bars({map}) {
  const entries=Object.entries(map)
  const max=Math.max(1,...entries.map(([,v])=>v))
  return <div className="bars">{entries.map(([k,v])=><div className="bar-row" key={k}><span>{k}</span><div><i style={{width:`${(v/max)*100}%`}}/></div><b>{v}</b></div>)}</div>
}
function Header({title,action}) { return <header><div><h1>{title}</h1><p>Track the admission funnel from enquiry to conversion.</p></div>{action}</header> }

function LeadList() {
  const [state,setState]=useState({items:[],total:0,page:1,pages:1})
  const [filters,setFilters]=useState({search:'',status:'',source:'',priority:''})
  const [loading,setLoading]=useState(true)
  const load=async(page=1)=>{
    setLoading(true)
    const params={...filters,page,limit:10}
    const {data}=await api.get('/leads',{params}); setState(data); setLoading(false)
  }
  useEffect(()=>{load(1)},[filters.status,filters.source,filters.priority])
  const exportCsv=()=> {
    const rows=[['Name','Phone','Email','Course','Source','Status','Priority','Counsellor','Ageing']]
      .concat(state.items.map(x=>[x.name,x.phone,x.email||'',x.course,x.source,x.status,x.priority,x.counsellor?.name||'Unassigned',x.ageingDays]))
    const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\\n')
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='admission-leads.csv'; a.click()
  }
  return <Layout>
    <Header title="Admission Leads" action={<Link className="primary btn" to="/leads/new">+ Add Lead</Link>}/>
    <div className="toolbar">
      <input placeholder="Search name, phone, course…" value={filters.search} onChange={e=>setFilters({...filters,search:e.target.value})} onKeyDown={e=>e.key==='Enter'&&load(1)}/>
      <select value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}><option value="">All statuses</option>{statuses.map(s=><option key={s}>{s}</option>)}</select>
      <select value={filters.source} onChange={e=>setFilters({...filters,source:e.target.value})}><option value="">All sources</option>{sources.map(s=><option key={s}>{s}</option>)}</select>
      <select value={filters.priority} onChange={e=>setFilters({...filters,priority:e.target.value})}><option value="">All priority</option><option>High</option><option>Medium</option><option>Low</option></select>
      <button onClick={()=>load(1)}>Search</button><button onClick={exportCsv}>Export CSV</button>
    </div>
    <section className="panel table-wrap">
      {loading?<div className="loading">Loading…</div>:<table><thead><tr><th>Lead</th><th>Course</th><th>Source</th><th>Status</th><th>Priority</th><th>Counsellor</th><th>Ageing</th><th></th></tr></thead>
      <tbody>{state.items.map(l=><tr key={l._id}><td><b>{l.name}</b><small>{l.phone}</small></td><td>{l.course}</td><td>{l.source}</td><td><span className={`pill ${slug(l.status)}`}>{l.status}</span></td><td>{l.priority}</td><td>{l.counsellor?.name||'Unassigned'}</td><td>{l.ageingDays}d</td><td><Link to={`/leads/${l._id}`}>View</Link></td></tr>)}</tbody></table>}
      <div className="pagination"><button disabled={state.page<=1} onClick={()=>load(state.page-1)}>Previous</button><span>Page {state.page} of {state.pages||1}</span><button disabled={state.page>=state.pages} onClick={()=>load(state.page+1)}>Next</button></div>
    </section>
  </Layout>
}

function slug(s){return s.toLowerCase().replaceAll(' ','-')}

function LeadForm() {
  const nav=useNavigate()
  const [counsellors,setCounsellors]=useState([])
  const [form,setForm]=useState({name:'',phone:'',email:'',city:'',source:'Website',course:courses[0],qualification:'',preferredIntake:'',status:'New',priority:'Medium',counsellor:'',notes:''})
  const [error,setError]=useState('')
  useEffect(()=>{api.get('/users/counsellors').then(r=>setCounsellors(r.data))},[])
  const save=async(e)=>{
    e.preventDefault()
    try{await api.post('/leads',{...form,counsellor:form.counsellor||undefined});nav('/leads')}
    catch(e){setError(e.response?.data?.message||'Could not create lead')}
  }
  return <Layout><Header title="Add Admission Lead" action={<Link className="btn" to="/leads">Back</Link>}/>
    <form className="panel form" onSubmit={save}>
      {error&&<div className="error">{error}</div>}
      <div className="form-grid">
        <Field label="Full name" required value={form.name} onChange={v=>setForm({...form,name:v})}/>
        <Field label="Phone" required value={form.phone} onChange={v=>setForm({...form,phone:v})}/>
        <Field label="Email" value={form.email} onChange={v=>setForm({...form,email:v})}/>
        <Field label="City" value={form.city} onChange={v=>setForm({...form,city:v})}/>
        <Select label="Lead source" value={form.source} options={sources} onChange={v=>setForm({...form,source:v})}/>
        <Select label="Course" value={form.course} options={courses} onChange={v=>setForm({...form,course:v})}/>
        <Field label="Qualification" value={form.qualification} onChange={v=>setForm({...form,qualification:v})}/>
        <Field label="Preferred intake" value={form.preferredIntake} onChange={v=>setForm({...form,preferredIntake:v})}/>
        <Select label="Priority" value={form.priority} options={['High','Medium','Low']} onChange={v=>setForm({...form,priority:v})}/>
        <Select label="Counsellor" value={form.counsellor} options={counsellors.map(x=>x._id)} labels={Object.fromEntries(counsellors.map(x=>[x._id,x.name]))} onChange={v=>setForm({...form,counsellor:v})}/>
      </div>
      <label>Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
      <button className="primary">Create Lead</button>
    </form>
  </Layout>
}

function Field({label,required,value,onChange}){return <label>{label}{required?' *':''}<input required={required} value={value} onChange={e=>onChange(e.target.value)}/></label>}
function Select({label,value,options,labels={},onChange}){return <label>{label}<select value={value} onChange={e=>onChange(e.target.value)}><option value="">Select</option>{options.map(x=><option value={x} key={x}>{labels[x]||x}</option>)}</select></label>}

function LeadDetail() {
  const {id}=useParams(), nav=useNavigate()
  const [lead,setLead]=useState(null), [counsellors,setCounsellors]=useState([]), [saving,setSaving]=useState(false)
  const [fu,setFu]=useState({scheduledAt:'',mode:'Call',outcome:'',nextAction:'',notes:''})
  const load=()=>api.get(`/leads/${id}`).then(r=>setLead(r.data))
  useEffect(()=>{load();api.get('/users/counsellors').then(r=>setCounsellors(r.data))},[id])
  if(!lead)return <Layout><div className="loading">Loading lead…</div></Layout>
  const update=async(patch)=>{setSaving(true);const r=await api.put(`/leads/${id}`,patch);setLead(r.data);setSaving(false)}
  const addFollow=async(e)=>{e.preventDefault();await api.post(`/leads/${id}/followups`,fu);setFu({scheduledAt:'',mode:'Call',outcome:'',nextAction:'',notes:''});load()}
  const complete=async(f)=>{await api.put(`/leads/${id}/followups/${f._id}`,{completed:true});load()}
  const remove=async()=>{if(confirm('Delete this lead?')){await api.delete(`/leads/${id}`);nav('/leads')}}
  return <Layout><Header title={lead.name} action={<Link className="btn" to="/leads">Back to leads</Link>}/>
    <div className="detail-grid">
      <section className="panel">
        <div className="detail-top"><div><h2>{lead.course}</h2><p>{lead.phone} · {lead.email||'No email'} · {lead.city||'No city'}</p></div><span className={`pill ${slug(lead.status)}`}>{lead.status}</span></div>
        <div className="form-grid">
          <Select label="Status" value={lead.status} options={statuses} onChange={v=>update({status:v})}/>
          <Select label="Priority" value={lead.priority} options={['High','Medium','Low']} onChange={v=>update({priority:v})}/>
          <Select label="Counsellor" value={lead.counsellor?._id||''} options={counsellors.map(x=>x._id)} labels={Object.fromEntries(counsellors.map(x=>[x._id,x.name]))} onChange={v=>update({counsellor:v||null})}/>
          <Field label="Next follow-up" value={lead.nextFollowUpAt?new Date(lead.nextFollowUpAt).toISOString().slice(0,16):''} onChange={v=>update({nextFollowUpAt:v||null})}/>
        </div>
        <p className="meta">Source: <b>{lead.source}</b> · Ageing: <b>{lead.ageingDays} days</b> · Created: {new Date(lead.createdAt).toLocaleDateString()}</p>
        <label>Notes<textarea defaultValue={lead.notes} onBlur={e=>update({notes:e.target.value})}/></label>
        <div className="actions"><button className="danger-btn" onClick={remove}>Delete</button>{saving&&<span>Saving…</span>}</div>
      </section>
      <section className="panel">
        <h2>Follow-up history</h2>
        <form className="follow-form" onSubmit={addFollow}>
          <input type="datetime-local" required value={fu.scheduledAt} onChange={e=>setFu({...fu,scheduledAt:e.target.value})}/>
          <select value={fu.mode} onChange={e=>setFu({...fu,mode:e.target.value})}>{['Call','WhatsApp','Email','Meeting','SMS'].map(x=><option key={x}>{x}</option>)}</select>
          <input placeholder="Outcome" value={fu.outcome} onChange={e=>setFu({...fu,outcome:e.target.value})}/>
          <input placeholder="Next action" value={fu.nextAction} onChange={e=>setFu({...fu,nextAction:e.target.value})}/>
          <button className="primary">Schedule</button>
        </form>
        <div className="timeline">{[...lead.followUps].reverse().map(f=><div className={`timeline-item ${f.completed?'done':''}`} key={f._id}><b>{f.mode}</b><span>{new Date(f.scheduledAt).toLocaleString()}</span><p>{f.outcome||'No outcome recorded'} {f.nextAction&&`· Next: ${f.nextAction}`}</p>{!f.completed&&<button onClick={()=>complete(f)}>Mark completed</button>}</div>)}</div>
      </section>
    </div>
  </Layout>
}

export default function App(){
  return <Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/" element={<Protected><Dashboard/></Protected>}/>
    <Route path="/leads" element={<Protected><LeadList/></Protected>}/>
    <Route path="/leads/new" element={<Protected><LeadForm/></Protected>}/>
    <Route path="/leads/:id" element={<Protected><LeadDetail/></Protected>}/>
  </Routes>
}