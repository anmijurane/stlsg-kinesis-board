"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CHARTS, GROUPS, getChart, labelFor, sourceFor, type Metadata, type Filters, type ChartDefinition, type ChartResult, type Datum } from "@/lib/analytics/registry";
import { defaultsFor, readFilters, writeFilters } from "@/lib/analytics/filters";
import { COMMENT_RULES } from "@/lib/analytics/comments";
import { DatePicker } from "./date-picker";
import { MultiSelect } from "./multi-select";
const NivoChart = dynamic(()=>import("./nivo-chart"),{ssr:false,loading:()=> <p className="chart-loading">Cargando gráfica…</p>});
const format = (n: number) => n.toLocaleString("es-MX",{maximumFractionDigits:2});
// Bound browser requests as well as database work. Abort superseded requests.
let activeRequests=0;
const waiting: (()=>void)[]=[];
async function fetchData(id: string, filters: Filters, signal: AbortSignal): Promise<ChartResult> {
  if(activeRequests>=3) await new Promise<void>((resolve)=>waiting.push(resolve));
  else activeRequests++;
  try {
    if(signal.aborted) throw new DOMException("Cancelado","AbortError");
    const params=new URLSearchParams(filters);
    const response=await fetch(`/api/analytics/${id}?${params}`,{signal});
    if(!response.ok) throw new Error("No se pudo consultar esta gráfica.");
    return await response.json();
  } finally {const next=waiting.shift();if(next)next();else activeRequests--;}
}
function FiltersForm({chart,metadata,applied,onApply,pending}: {chart:ChartDefinition;metadata:Metadata;applied:Filters;onApply:(filters:Filters)=>void;pending:boolean}) {
  const [draft,setDraft]=useState(applied);
  const [error,setError]=useState("");
  const dates=metadata.dates[sourceFor(chart,draft)]||[];
  const update=(key:string,value:string)=> {
    setDraft((previous)=> {
      let next={...previous,[key]:value};
      if(key==="mode" || (chart.id==="sedes" && key==="metric")) {
        delete next.from;delete next.to;delete next.selection;delete next.page;
        if(chart.id==="satisfaccion-rutinas-sedes" && value==="club") {delete next.routine;delete next.level;}
        next=defaultsFor(chart,metadata,next);
      }
      return next;
    });
  };
  return <form onSubmit={(event)=>{event.preventDefault();setError("");if(!dates.includes(draft.from)||!dates.includes(draft.to)||draft.from>draft.to){setError("Selecciona fechas disponibles y un intervalo válido.");return;}const next={...draft};delete next.selection;delete next.page;onApply(next);}}>
    <div className="chart-filter-grid">
      <DatePicker label="Desde" value={draft.from || ""} dates={dates} max={draft.to} onChange={(value)=>update("from",value)}/>
      <DatePicker label="Hasta" value={draft.to || ""} dates={dates} min={draft.from} onChange={(value)=>update("to",value)}/>
      {chart.controls.map((control)=> {
        const disabled=chart.id==="satisfaccion-rutinas-sedes" && draft.mode!=="routine" && ["routine","level"].includes(control.key);
        const options=control.options||(control.dimension?metadata.dimensions[control.dimension]||[]:undefined);
        if (control.multiple && options) return <MultiSelect key={control.key} label={control.label} allLabel={control.key === "club" ? "Todas las sedes" : control.key === "city" ? "Todas las ciudades" : "Todos los días"} options={options} value={draft[control.key]?.split(",") || []} disabled={disabled} onChange={(selected)=>update(control.key,selected.join(","))}/>;
        return <label key={control.key}>{control.label}{options?<select multiple={control.multiple} size={control.multiple?3:undefined} disabled={disabled} value={control.multiple?(draft[control.key]?.split(",")||[]):draft[control.key]||""} onChange={(e)=>update(control.key,control.multiple?Array.from(e.target.selectedOptions).map((o)=>o.value).join(","):e.target.value)}>{!control.multiple&&<option value="">Todos</option>}{options.map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:<input type={control.numeric?"number":"search"} min={control.numeric?0:undefined} max={control.key.startsWith("hour")?23:control.numeric?10000000:undefined} step={control.numeric?"any":undefined} maxLength={control.numeric?undefined:200} value={draft[control.key]||""} onChange={(e)=>update(control.key,e.target.value)} />}</label>;
      })}
    </div>
    <p className="filter-hint">Marca una o varias opciones y pulsa «Aplicar filtros» para actualizar esta gráfica.</p>
    <div className="chart-actions"><button className="primary-button" type="submit" disabled={pending||!dates.length}>Aplicar filtros</button><button className="secondary-button" type="button" onClick={()=>onApply(defaultsFor(chart,metadata))} disabled={pending}>Restablecer</button></div>
    {error&&<p role="alert">{error}</p>}
  </form>;
}
function Table({rows,onSelect,unit,kind}:{rows:Datum[];onSelect:(id:string)=>void;unit:string;kind:string}) {
  return <div className="table-scroll analytics-table"><table className="sessions-table"><caption>Datos de la gráfica · {unit}. Selecciona una fila para filtrar.</caption><thead><tr><th scope="col">Categoría / intervalo</th><th scope="col">Serie</th><th scope="col" className="numeric">Valor</th><th scope="col" className="numeric">Muestra</th></tr></thead><tbody>{rows.map((r,i)=><tr key={`${r.id}-${r.series}-${i}`}><th scope="row"><button className="text-button" onClick={()=>onSelect(kind==="heatmap"?`${r.id}:${r.label}`:r.id)}>{kind==="heatmap"?`${["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"][Number(r.id)-1]}, ${r.label} h`:r.label}</button></th><td>{r.series}</td><td className="numeric">{format(r.value)}</td><td className="numeric">{format(r.sample)}</td></tr>)}</tbody></table></div>;
}
function ChartCard({chart,metadata,detail,query,onApply}:{chart:ChartDefinition;metadata:Metadata;detail:boolean;query:string;onApply:(chart:ChartDefinition,filters:Filters)=>void}) {
  const router=useRouter();
  const raw=readFilters(chart,new URLSearchParams(query));
  const filters=defaultsFor(chart,metadata,raw);
  const signature=JSON.stringify(filters);
  const [state,setState]=useState<{key:string;data:ChartResult|null;error?:string}>({key:"",data:null});
  const [retry,setRetry]=useState(0);
  const anchor=useRef<HTMLElement>(null);
  useEffect(()=> {
    const controller=new AbortController();
    const selected:Filters=JSON.parse(signature);
    void fetchData(chart.id,selected,controller.signal).then((data)=>{if(!controller.signal.aborted)setState({key:signature,data});}).catch((error)=>{if(!controller.signal.aborted)setState({key:signature,data:null,error:error instanceof Error?error.message:"No se pudo cargar la gráfica."});});
    return ()=>controller.abort();
  },[chart.id,signature,retry]);
  const pending=state.key!==signature||(!state.data&&!state.error);
  const data=state.key===signature?state.data:null;
  const failure=state.error||data?.error;
  const dates=metadata.dates[sourceFor(chart,filters)]||[];
  const href=`/resumen/${chart.id}?${query}`;
  const apply=(next:Filters)=>onApply(chart,next);
  const select=(value:string)=> {
    const next:Filters={...filters,selection:value};delete next.page;
    if(detail) { apply(next);anchor.current?.scrollIntoView({behavior:"smooth",block:"start"}); }
    else {router.push(`/resumen/${chart.id}?${writeFilters(new URLSearchParams(window.location.search),chart,next)}`);}
  };
  let kind=chart.kind;
  if(chart.id==="interacciones"&&filters.grouping==="time")kind="line";
  const visibleIds = [...new Set(data?.rows.map((r)=>r.id) || [])];
  const truncated = !detail && kind === "bar" && visibleIds.length > 10;
  const chartRows = truncated ? data?.rows.filter((r)=>visibleIds.slice(0,10).includes(r.id)) || [] : data?.rows || [];
  const positive=data?.rows.find((r)=>r.id==="happy")?.value||0;
  const total=data?.rows.reduce((n,r)=>n+r.value,0)||0;
  return <section ref={anchor} className={`analytics-card ${detail?"analytics-detail":""}`} id={chart.id} aria-labelledby={`${chart.id}-heading`} aria-busy={pending}>
    <div className="section-heading"><div><h2 id={`${chart.id}-heading`}>{chart.title}</h2><p>{chart.description}</p></div>{!detail&&<Link className="text-button" href={href}>Explorar ↗</Link>}</div>
    <p className="chart-period">Periodo: <strong>{filters.from||"—"} → {filters.to||"—"}</strong> · Ciudad de México</p>
    <details className="chart-filters" open={detail||undefined}><summary>Filtros de esta gráfica</summary><FiltersForm key={signature} chart={chart} metadata={metadata} applied={filters} onApply={apply} pending={pending}/></details>
    {filters.selection&&<p className="chart-selection">Selección: {labelFor(filters.selection)} <button className="text-button" onClick={()=>{const next={...filters};delete next.selection;delete next.page;apply(next);}}>Quitar selección</button></p>}
    {!dates.length?<p className="section-empty">No hay registros disponibles para esta fuente.</p>:pending?<div className="chart-canvas chart-loading" role="status">Consultando datos…</div>:failure?<div className="connection-notice" role="alert"><p>{failure}</p><button className="text-button" onClick={()=>{setState({key:"",data:null});setRetry((r)=>r+1);}}>Reintentar</button></div>:data&&<>
      {chart.id === "trafico" ? <dl className="chart-totals">{[...new Set(data.rows.map((r)=>r.series))].map((series)=><div key={series}><dt>{series}</dt><dd>{format(data.rows.filter((r)=>r.series===series).reduce((sum,r)=>sum+r.value,0))}</dd></div>)}</dl> : <div className="chart-stat"><strong>{format(data.sample)}</strong><span> registros en la muestra{chart.id==="satisfaccion"&&total>0?` · ${format(positive/total*100)}% de satisfacción`:""}</span></div>}
      {data.rows.length&&data.rows.some((r)=>r.value!==0)?<><div className={`chart-canvas chart-${kind}`} style={kind==="bar"?{height:Math.min(detail?2400:520,Math.max(detail?480:320,new Set(chartRows.map((r)=>r.id)).size*27+90))}:undefined}><NivoChart rows={chartRows} kind={kind} unit={data.unit} onSelect={select}/></div><div className="chart-legend">{[...new Set(data.rows.map((r)=>r.series))].map((series)=><span key={series}>{series}</span>)}</div></>:<p className="section-empty">Sin actividad para estos filtros.</p>}
      {truncated&&<p className="chart-footnote">Vista principal: 10 categorías. Abre «Explorar» o la tabla para consultar todas.</p>}
      {data.trend&&data.trend.length>0&&<><h3>Evolución de satisfacción (%)</h3><div className="chart-canvas"><NivoChart rows={data.trend} kind="line" unit="%" onSelect={(value)=>{
        const start=new Date(`${value.slice(0,10)}T00:00:00Z`);
        const end=new Date(start);
        if(filters.granularity==="month")end.setUTCMonth(end.getUTCMonth()+1);
        else end.setUTCDate(end.getUTCDate()+(filters.granularity==="week"?7:1));
        const available=dates.filter((d)=>d>=start.toISOString().slice(0,10)&&d<end.toISOString().slice(0,10)&&d>=filters.from&&d<=filters.to);
        if(available.length)apply({...filters,from:available[0],to:available[available.length-1]});
      }}/></div></>}
      {detail?<Table rows={data.rows} unit={data.unit} kind={kind} onSelect={select}/>:<details className="chart-data"><summary>Ver datos y seleccionar con teclado</summary><Table rows={data.rows} unit={data.unit} kind={kind} onSelect={select}/></details>}
      {chart.id==="embudo"&&<div className="funnel-rates"><h3>Conversión entre etapas</h3>{data.rows.slice(1).map((r,i)=>{const previous=data.rows[i].value;return <p key={r.id}>{r.label}: {previous?format(r.value/previous*100):"—"}% continúa · {previous?format((previous-r.value)/previous*100):"—"}% no tiene el siguiente paso observado</p>;})}</div>}
      {chart.id==="comentarios"&&detail&&<><details><summary>Reglas de clasificación</summary><ul>{COMMENT_RULES.map((r)=><li key={r.id}><strong>{r.label}:</strong> {r.pattern}</li>)}<li>Otros/sin clasificar: sin coincidencia. Se asigna la primera categoría coincidente.</li></ul></details><div className="table-scroll"><table className="sessions-table"><caption>Comentarios · clasificación aproximada</caption><thead><tr><th>Fecha local</th><th>Sede</th><th>Valoración</th><th>Tema</th><th>Comentario</th></tr></thead><tbody>{data.comments?.map((r)=><tr key={r.id}><td>{r.date}</td><td>{r.club}</td><td>{labelFor(r.emoji)}</td><td>{labelFor(r.category)}</td><td className="comment-text">{r.comment}</td></tr>)}</tbody></table></div><div className="pagination"><span>{format(data.commentTotal||0)} comentarios · página {filters.page||1}</span><div><button className="secondary-button" disabled={Number(filters.page||1)<=1} onClick={()=>apply({...filters,page:String(Number(filters.page||1)-1)})}>Anterior</button><button className="secondary-button" disabled={Number(filters.page||1)*20>=(data.commentTotal||0)} onClick={()=>apply({...filters,page:String(Number(filters.page||1)+1)})}>Siguiente</button></div></div></>}
      <p className="chart-footnote">Cobertura: {dates[0]} → {dates.at(-1)} · Actualizado {new Date(data.updatedAt).toLocaleString("es-MX",{timeZone:"America/Mexico_City"})}. Reutilización de consultas: hasta 5 minutos.</p>
      {chart.source==="routine_feedback"||chart.id==="satisfaccion-rutinas-sedes"?<p className="chart-footnote">Interpreta los porcentajes junto al tamaño de muestra. El feedback directo puede tener pocas respuestas.</p>:null}
    </>}
  </section>;
}
export function AnalyticsBoard({metadata,chartId,error}:{metadata:Metadata;chartId?:string;error?:string}) {
  const params=useSearchParams();
  const query=params.toString();
  const selected=chartId?getChart(chartId):undefined;
  const onApply=(chart:ChartDefinition,filters:Filters)=> {
    const next=writeFilters(new URLSearchParams(window.location.search),chart,filters);
    window.history.replaceState(null,"",`${window.location.pathname}?${next}`);
  };
  return <>
    {selected&&<Link className="text-button" href={`/resumen?${query}#${selected.id}`}>← Volver a Resumen</Link>}
    <div className="page-heading-row"><div><p className="eyebrow">Análisis de actividad</p><h1>{selected?selected.title:"Resumen de actividad"}</h1><p>{selected?"Explora los datos con filtros propios y detalle de resultados.":"Todas las gráficas, cada una con su periodo y sus propios filtros."}</p></div></div>
    <p className="analytics-intro">Las cifras representan actividad registrada. Las consultas no confirman entrenamiento o finalización y las sesiones no equivalen a personas únicas.</p>
    {!selected&&metadata.overview&&<section className="metrics-summary" aria-label="Totales históricos"><p className="eyebrow">Totales históricos · independientes de los filtros de cada gráfica</p><dl>{[
      {label:"Sesiones",value:format(metadata.overview.sessions)},
      {label:"Páginas vistas",value:format(metadata.overview.pages)},
      {label:"Eventos",value:format(metadata.overview.events)},
      {label:"Satisfacción general",value:metadata.overview.satisfaction==null?"—":`${format(metadata.overview.satisfaction)}%`,note:`${format(metadata.overview.feedback)} valoraciones`},
    ].map((item)=><div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd>{item.note&&<p>{item.note}</p>}</div>)}</dl></section>}
    {error?<div className="connection-notice" role="status"><strong>Los datos no están disponibles</strong><p>{error}</p><button className="text-button" onClick={()=>window.location.reload()}>Volver a cargar</button></div>:selected?<ChartCard chart={selected} metadata={metadata} detail query={query} onApply={onApply}/>:<><nav className="analytics-sections" aria-label="Áreas del resumen">{GROUPS.map((group,i)=><a key={group} href={`#area-${i}`}>{group}</a>)}</nav>{GROUPS.map((group,i)=><section className="analytics-area" id={`area-${i}`} key={group}><div className="analytics-area-heading"><span>{String(i+1).padStart(2,"0")}</span><h2>{group}</h2></div><div className="analytics-grid">{CHARTS.filter((chart)=>chart.group===i).map((chart)=><ChartCard key={chart.id} chart={chart} metadata={metadata} detail={false} query={query} onApply={onApply}/>)}</div></section>)}</>}
  </>;
}
