// Copyright (c) 2025 Damien Boisvert (AlphaGameDeveloper)
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

var p=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"],c=0,k=function(e){if(0>p.indexOf(e.key)||e.key!==p[c]){c=0;return}if(c++,p.length===c){c=0;let t=document.createElement("video");t.setAttribute("autoplay",!0);let r=document.createElement("source");r.setAttribute("src","https://archive.org/download/Rick_Astley_Never_Gonna_Give_You_Up/Rick_Astley_Never_Gonna_Give_You_Up.mp4"),r.setAttribute("type","video/mp4"),t.appendChild(r),document.body.appendChild(t),t.style.zIndex=10000;t.style.position="fixed",t.style.top="50%",t.style.left="50%",t.style.transform="translate(-50%, -50%)",t.style.width="100%"}};document.addEventListener("keydown",k,false);