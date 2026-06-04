import{r as e,j as f}from"./chunk-QUQL4437-BXPjeQdd.js";import{p as h}from"./IconBase.es-CD2qb-kX.js";import{p as g}from"./emails-BBDWqZLX.js";const u=new Map([["bold",e.createElement(e.Fragment,null,e.createElement("path",{d:"M236,200a12,12,0,0,1-24,0,84.09,84.09,0,0,0-84-84H61l27.52,27.51a12,12,0,0,1-17,17l-48-48a12,12,0,0,1,0-17l48-48a12,12,0,0,1,17,17L61,92h67A108.12,108.12,0,0,1,236,200Z"}))],["duotone",e.createElement(e.Fragment,null,e.createElement("path",{d:"M80,56v96L32,104Z",opacity:"0.2"}),e.createElement("path",{d:"M128,96H88V56a8,8,0,0,0-13.66-5.66l-48,48a8,8,0,0,0,0,11.32l48,48A8,8,0,0,0,88,152V112h40a88.1,88.1,0,0,1,88,88,8,8,0,0,0,16,0A104.11,104.11,0,0,0,128,96ZM72,132.69,43.31,104,72,75.31Z"}))],["fill",e.createElement(e.Fragment,null,e.createElement("path",{d:"M232,200a8,8,0,0,1-16,0,88.1,88.1,0,0,0-88-88H88v40a8,8,0,0,1-13.66,5.66l-48-48a8,8,0,0,1,0-11.32l48-48A8,8,0,0,1,88,56V96h40A104.11,104.11,0,0,1,232,200Z"}))],["light",e.createElement(e.Fragment,null,e.createElement("path",{d:"M230,200a6,6,0,0,1-12,0,90.1,90.1,0,0,0-90-90H46.49l37.75,37.76a6,6,0,1,1-8.48,8.48l-48-48a6,6,0,0,1,0-8.48l48-48a6,6,0,0,1,8.48,8.48L46.49,98H128A102.12,102.12,0,0,1,230,200Z"}))],["regular",e.createElement(e.Fragment,null,e.createElement("path",{d:"M232,200a8,8,0,0,1-16,0,88.1,88.1,0,0,0-88-88H51.31l34.35,34.34a8,8,0,0,1-11.32,11.32l-48-48a8,8,0,0,1,0-11.32l48-48A8,8,0,0,1,85.66,61.66L51.31,96H128A104.11,104.11,0,0,1,232,200Z"}))],["thin",e.createElement(e.Fragment,null,e.createElement("path",{d:"M228,200a4,4,0,0,1-8,0,92.1,92.1,0,0,0-92-92H41.66l41.17,41.17a4,4,0,0,1-5.66,5.66l-48-48a4,4,0,0,1,0-5.66l48-48a4,4,0,0,1,5.66,5.66L41.66,100H128A100.11,100.11,0,0,1,228,200Z"}))]]),b=e.forwardRef((t,a)=>e.createElement(h,{ref:a,...t,weights:u}));b.displayName="ArrowBendUpLeftIcon";function E(t){return t?t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function H({body:t,autoSize:a}){const l=e.useRef(null),[i,s]=e.useState(a?100:0),n=e.useCallback(r=>{var o;a&&r.source===((o=l.current)==null?void 0:o.contentWindow)&&r.data&&typeof r.data=="object"&&r.data.__emailIframeHeight&&typeof r.data.height=="number"&&r.data.height>0&&s(r.data.height)},[a]);return e.useEffect(()=>(window.addEventListener("message",n),()=>window.removeEventListener("message",n)),[n]),e.useEffect(()=>{const r=l.current;if(!r||!t)return;const c=/<[a-z][\s\S]*?>/i.test(t)?t.replace(/\n/g,"<br>"):E(t).replace(/\n/g,"<br>").replace(/\\n/g,"<br>"),p=g.sanitize(c,{USE_PROFILES:{html:!0},FORBID_TAGS:["style"],ADD_ATTR:["target"],FORCE_BODY:!0}),m=a?"0":"24px",d=a?`<script>
				function reportHeight() {
					var h = document.body.scrollHeight;
					if (h > 0) parent.postMessage({ __emailIframeHeight: true, height: h }, "*");
				}
				reportHeight();
				setTimeout(reportHeight, 50);
				setTimeout(reportHeight, 150);
				setTimeout(reportHeight, 400);
			<\/script>`:"";r.srcdoc=`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: cid: https:; script-src 'unsafe-inline';">
<style>
* { box-sizing: border-box; }
html {
	background: #ffffff;
	color-scheme: light;
}
body {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	font-size: 14px;
	line-height: 1.6;
	color: #1a1a1a;
	background: #ffffff;
	padding: ${m};
	margin: 0;
	word-wrap: break-word;
	overflow-wrap: break-word;
	${a?"overflow: hidden;":""}
}
[style*="position: fixed"], [style*="position:fixed"], [style*="position: absolute"], [style*="position:absolute"] {
	position: relative !important;
}
a { color: #2563eb; }
img { max-width: 100%; height: auto; }
blockquote {
	border-left: 3px solid #d1d5db;
	padding-left: 1em;
	margin-left: 0;
	color: #6b7280;
}
pre {
	background: #f3f4f6;
	padding: 12px;
	border-radius: 6px;
	overflow-x: auto;
	font-size: 13px;
}
table { border-collapse: collapse; max-width: 100%; }
td, th { padding: 4px 8px; }
p { margin: 4px 0; }
h1, h2, h3 { margin: 8px 0 4px; }
ul, ol { padding-left: 20px; margin: 4px 0; }
</style>
</head>
<body>${p}${d}</body>
</html>`},[t,a]),f.jsx("iframe",{ref:l,className:"block w-full border-0",style:a?{height:`${i}px`}:{height:"100%"},sandbox:"allow-scripts allow-popups allow-top-navigation-by-user-activation",title:"Email content"})}export{H as E,b as o};
