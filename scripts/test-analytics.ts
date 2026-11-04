import assert from "node:assert/strict";
import { test } from "node:test";
import { CHARTS, getChart, sourceFor, type Metadata, type Filters } from "../src/lib/analytics/registry";
import { defaultsFor, readFilters, validateFilters, writeFilters } from "../src/lib/analytics/filters";
import { classifyComment } from "../src/lib/analytics/comments";
const metadata: Metadata = { dates: { traffic: ["2026-05-01","2026-05-20","2026-06-15","2026-06-18"], sessions: ["2026-05-01","2026-05-20","2026-06-15","2026-06-18"], feedback: ["2026-01-11","2026-06-05","2026-06-18"], routine_feedback: ["2026-06-15","2026-06-16","2026-06-18"] }, dimensions: { cities: [{ value: "CDMX",label:"CDMX" }], clubs: [{value:"club1",label:"Sede 1"}], routines: [{value:"adaptation",label:"Adaptación"}], levels:[{value:"1",label:"Nivel 1"}] } };
const traffic = getChart("trafico")!;
test("el periodo inicial termina en el último día de BD, no en hoy",()=>{
  const f=defaultsFor(traffic,metadata);
  assert.equal(f.from,"2026-05-20");assert.equal(f.to,"2026-06-18");
});
test("rechaza fechas futuras, días ausentes, rangos inversos y SQL por URL",()=>{
  for(const input of ([{from:"2026-06-19"},{from:"2026-06-17"},{from:"2026-06-18",to:"2026-05-20"},{from:"2026-05-20';SELECT 1--"},{sql:"SELECT 1"}] as Filters[])) assert.throws(()=>validateFilters(traffic,metadata,input));
});
test("los valores iniciales de todas las gráficas respetan sus controles públicos",()=>{
  for(const chart of CHARTS) assert.doesNotThrow(()=>validateFilters(chart,metadata,defaultsFor(chart,metadata)));
});
test("las selecciones múltiples solo admiten identificadores del catálogo",()=>{
  assert.equal(validateFilters(traffic,metadata,{city:"CDMX",club:"club1"}).city,"CDMX");
  assert.throws(()=>validateFilters(traffic,metadata,{city:"Ciudad inventada"}));
});
test("la fuente de fechas cambia al comparar feedback directo de rutina",()=>{
  const chart=getChart("satisfaccion-rutinas-sedes")!;
  const f=defaultsFor(chart,metadata,{mode:"routine"});
  assert.equal(sourceFor(chart,f),"routine_feedback");assert.equal(f.from,"2026-06-15");
  assert.throws(()=>validateFilters(chart,metadata,{...f,to:"2026-06-17"}));
});
test("reescribir un filtro conserva el estado de las demás gráficas y permite ida y vuelta",()=>{
  const params=new URLSearchParams("horarios.hourMin=9&trafico.series=all");
  const result=writeFilters(params,traffic,{series:"sessions",from:"2026-05-20",to:"2026-06-18"});
  assert.equal(result.get("horarios.hourMin"),"9");
  assert.deepEqual(readFilters(traffic,result),{from:"2026-05-20",to:"2026-06-18",series:"sessions"});
});
test("rechaza horas fraccionarias, duración inversa y paginación inválida",()=>{
  assert.throws(()=>validateFilters(getChart("horarios")!,metadata,{hourMin:"1.5"}));
  assert.throws(()=>validateFilters(getChart("horarios")!,metadata,{hourMin:"22",hourMax:"8"}));
  assert.throws(()=>validateFilters(getChart("compromiso")!,metadata,{durationMin:"10",durationMax:"2"}));
  assert.throws(()=>validateFilters(getChart("comentarios")!,metadata,{page:"-1"}));
});
test("la clasificación da prioridad a problemas técnicos sobre ejecución y sugerencias",()=>{
  assert.equal(classifyComment("No carga el video, sugiero agregar instrucciones"),"technical");
  assert.equal(classifyComment("¿Cómo hacer el movimiento? Me gustaría una explicación"),"execution");
  assert.equal(classifyComment("Sugiero agregar otra rutina"),"suggestion");
  assert.equal(classifyComment("Todo bien"),"other");
});
test("sin fechas, los valores iniciales no inventan un intervalo",()=>{
  const f=defaultsFor(traffic,{dates:{},dimensions:{}});
  assert.equal(f.from,undefined);assert.equal(f.to,undefined);
});
