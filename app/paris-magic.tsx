"use client";

import { useEffect, useRef } from "react";

export function ParisMagic({ active, finale }: { active: boolean; finale: number }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const finaleRef = useRef(finale);
  useEffect(() => { finaleRef.current = finale; }, [finale]);

  useEffect(() => {
    if (!active || !mountRef.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const supportProbe = document.createElement("canvas");
    if (!supportProbe.getContext("webgl2") && !supportProbe.getContext("webgl")) return;
    const mount = mountRef.current;
    let dispose: (() => void) | undefined;
    let cancelled = false;
    void import("three").then(THREE => {
      if (cancelled) return;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, .1, 100);
      camera.position.z = 7;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.setSize(innerWidth, innerHeight);
      mount.appendChild(renderer.domElement);

      const count = innerWidth < 700 ? 300 : 720;
      const current = new Float32Array(count * 3), drift = new Float32Array(count * 3), tower = new Float32Array(count * 3), celebration = new Float32Array(count * 3), colours = new Float32Array(count * 3);
      const gold = new THREE.Color("#e7bd69"), cream = new THREE.Color("#fff0d2"), rose = new THREE.Color("#c95a5d");
      for (let i = 0; i < count; i++) {
        const k = i * 3;
        drift[k] = (Math.random() - .5) * 14; drift[k + 1] = (Math.random() - .5) * 9; drift[k + 2] = (Math.random() - .5) * 3;
        current[k] = drift[k]; current[k + 1] = drift[k + 1]; current[k + 2] = drift[k + 2];
        const level = Math.random(), y = -3.35 + level * 6.4, width = .12 + Math.pow(1 - level, 1.55) * 1.75, beam = i % 9 === 0;
        tower[k] = beam ? (Math.random() - .5) * width * 2 : (i % 2 ? -1 : 1) * width * (.82 + Math.random() * .18);
        tower[k + 1] = beam ? [-1.92, -.18, 1.1][i % 3] + (Math.random() - .5) * .08 : y; tower[k + 2] = (Math.random() - .5) * .18;
        const burst = i % 3;
        const a = Math.PI * 2 * ((i * 17) % 61) / 61;
        const radius = .2 + ((i * 11) % 43) / 43 * 1.22;
        celebration[k] = [-1.75, 1.62, 0][burst] + Math.cos(a) * radius;
        celebration[k + 1] = [.72, .43, -1.13][burst] + Math.sin(a) * radius;
        celebration[k + 2] = (Math.random() - .5) * .35;
        const c = i % 8 === 0 ? rose : i % 3 === 0 ? cream : gold; colours.set([c.r, c.g, c.b], k);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(current, 3)); geometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
      const material = new THREE.PointsMaterial({ size: innerWidth < 700 ? .04 : .035, transparent: true, opacity: .7, vertexColors: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const particles = new THREE.Points(geometry, material); scene.add(particles);
      const path = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-5.8,-1.5,0),new THREE.Vector3(0,2.7,0),new THREE.Vector3(5.8,.5,0));
      const pathGeometry = new THREE.BufferGeometry().setFromPoints(path.getPoints(90));
      const pathLine = new THREE.Line(pathGeometry,new THREE.LineBasicMaterial({ color:0xe7bd69, transparent:true, opacity:.23 })); scene.add(pathLine);
      const planeShape = new THREE.Shape(); planeShape.moveTo(-.24,-.1); planeShape.lineTo(.32,0); planeShape.lineTo(-.24,.1); planeShape.lineTo(-.08,0); planeShape.closePath();
      const plane = new THREE.Mesh(new THREE.ShapeGeometry(planeShape),new THREE.MeshBasicMaterial({color:0xfff0d2,transparent:true,opacity:.92,side:THREE.DoubleSide})); scene.add(plane);

      let pointerX=0,pointerY=0,frame=0,lastFinale=finaleRef.current,celebrationUntil=0;
      const pointer=(e:PointerEvent)=>{pointerX=e.clientX/innerWidth-.5;pointerY=e.clientY/innerHeight-.5};
      const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)};
      addEventListener("pointermove",pointer,{passive:true}); addEventListener("resize",resize);
      const clock=new THREE.Clock();
      const animate=()=>{
        const t=clock.getElapsedTime(); if(lastFinale!==finaleRef.current){lastFinale=finaleRef.current;celebrationUntil=t+5.2}
        const parisRect=document.getElementById("paris")?.getBoundingClientRect();
        const parisMix=parisRect?Math.max(0,Math.min(1,(innerHeight-parisRect.top)/(innerHeight*.72))):0;
        const celebrationMix=t<celebrationUntil?Math.min(1,(celebrationUntil-t)/.8):0, target=celebrationMix>.02?celebration:tower, formation=celebrationMix>.02?celebrationMix:parisMix;
        const pos=geometry.attributes.position as { getX(index:number):number; getY(index:number):number; getZ(index:number):number; setXYZ(index:number,x:number,y:number,z:number):void; needsUpdate:boolean };
        for(let i=0;i<count;i++){const k=i*3,wanderX=drift[k]+Math.sin(t*.23+i)*.05;let wanderY=drift[k+1]+t*(.02+(i%5)*.001);while(wanderY>4.5)wanderY-=9;const tx=wanderX*(1-formation)+target[k]*formation,ty=wanderY*(1-formation)+target[k+1]*formation,tz=drift[k+2]*(1-formation)+target[k+2]*formation;pos.setXYZ(i,pos.getX(i)+(tx-pos.getX(i))*.055,pos.getY(i)+(ty-pos.getY(i))*.055,pos.getZ(i)+(tz-pos.getZ(i))*.055)}
        pos.needsUpdate=true;particles.rotation.y=Math.sin(t*.18)*.06+pointerX*.05;particles.rotation.x=pointerY*.035;material.opacity=.48+formation*.38;material.size=(innerWidth<700?.04:.035)+formation*.018;
        const travel=((scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))*.82+t*.025)%1;plane.position.copy(path.getPoint(travel));const tangent=path.getTangent(travel);plane.rotation.z=Math.atan2(tangent.y,tangent.x);pathLine.visible=parisMix<.78&&celebrationMix<.02;plane.visible=pathLine.visible;
        camera.position.x+=(pointerX*.18-camera.position.x)*.025;camera.position.y+=(-pointerY*.12-camera.position.y)*.025;renderer.render(scene,camera);frame=requestAnimationFrame(animate);
      };
      animate();
      dispose=()=>{cancelAnimationFrame(frame);removeEventListener("pointermove",pointer);removeEventListener("resize",resize);geometry.dispose();pathGeometry.dispose();material.dispose();(pathLine.material as {dispose():void}).dispose();(plane.geometry as {dispose():void}).dispose();(plane.material as {dispose():void}).dispose();renderer.dispose();renderer.domElement.remove()};
    }).catch(() => undefined);
    return()=>{cancelled=true;dispose?.()};
  },[active]);
  return <div className="paris-magic" ref={mountRef} aria-hidden="true"/>;
}
