import React from 'react'
export const inputClass='w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500'
export const btnClass='rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50'
export const secondaryClass='rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50'
export const Panel=({title,children}:{title:string,children:React.ReactNode})=><section className="rounded-xl border bg-white p-5 shadow-sm"><h3 className="mb-4 text-lg font-semibold">{title}</h3>{children}</section>
export const Heading=({title,desc}:{title:string,desc:string})=><header><h2 className="text-2xl font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{desc}</p></header>
export const Notice=({children}:{children:React.ReactNode})=><p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{children}</p>
export function Table({headers,rows}:{headers:string[],rows:React.ReactNode[][]}){return <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-100"><tr>{headers.map(h=><th className="px-3 py-3" key={h}>{h}</th>)}</tr></thead><tbody>{rows.length?rows.map((cells,i)=><tr className="border-b" key={i}>{cells.map((cell,j)=><td key={j} className="px-3 py-3">{cell}</td>)}</tr>):<tr><td colSpan={headers.length} className="p-6 text-center text-slate-500">Không có dữ liệu phù hợp</td></tr>}</tbody></table></div>}
export const money=(value:unknown)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(Number(value)||0)
export const val=(r:Record<string,unknown>,...keys:string[])=>{for(const k of keys){if(r[k]!==undefined&&r[k]!==null)return String(r[k])}return '—'}
export const today=()=>new Date().toLocaleDateString('en-CA')
export const errorMessage=(e:unknown)=> e instanceof Error ? e.message : 'Không thể tải dữ liệu'
