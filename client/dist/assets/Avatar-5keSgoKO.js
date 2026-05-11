import{c,j as a,s as x,g as r}from"./index-CNOE4qd7.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=c("ChartNoAxesColumn",[["line",{x1:"18",x2:"18",y1:"20",y2:"10",key:"1xfpm4"}],["line",{x1:"12",x2:"12",y1:"20",y2:"4",key:"be30l9"}],["line",{x1:"6",x2:"6",y1:"20",y2:"14",key:"1r4le6"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=c("MapPin",[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=c("Pen",[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]]),d={sm:"w-8 h-8 text-xs",md:"w-10 h-10 text-sm",lg:"w-12 h-12 text-base",xl:"w-16 h-16 text-lg"},h={online:"bg-accent-green",offline:"bg-neutral-400",away:"bg-accent-amber",busy:"bg-accent-red"},m=s=>s.split(" ").map(l=>l[0]).join("").toUpperCase().slice(0,2),p=({src:s,alt:l,name:t,size:e="md",status:n,className:o})=>{const i=t?m(t):"";return a.jsxs("div",{className:r("relative inline-block",o),children:[a.jsx("div",{className:r("rounded-full flex items-center justify-center overflow-hidden","bg-primary text-white font-semibold",d[e]),children:s?a.jsx("img",{src:s,alt:l||t||"User avatar",className:"w-full h-full object-cover"}):i?a.jsx("span",{children:i}):a.jsx(x,{size:e==="xl"?32:e==="lg"?24:e==="sm"?16:20})}),n&&a.jsx("span",{className:r("absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-dark-surface",h[n],e==="xl"?"w-5 h-5":e==="lg"?"w-4 h-4":"w-3 h-3"),"aria-label":`Status: ${n}`})]})};export{p as A,g as C,y as M,b as P};
