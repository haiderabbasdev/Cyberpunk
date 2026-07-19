import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import gsap from 'gsap';
import LocomotiveScroll from 'locomotive-scroll';

const locomotiveScroll = new LocomotiveScroll({
    lenisOptions: {
        lerp: window.innerWidth < 768 ? 0.05 : 0.1,
        wheelMultiplier: window.innerWidth < 768 ? 0.5 : 1,
        touchMultiplier: window.innerWidth < 768 ? 0.5 : 1,
    }
});
// scene
const scene = new THREE.Scene();

// camera
function getCameraSettings() {
    const w = window.innerWidth;
    if (w < 768) return { fov: 65, z: 4.5 };       // mobile
    if (w < 1024) return { fov: 50, z: 4.5 };      // tablet
    return { fov: 40, z: 3.5 };                     // desktop
}
const camSettings = getCameraSettings();
const camera = new THREE.PerspectiveCamera(camSettings.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, camSettings.z);

// renderer
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#canvas'),
    antialias: true,
    alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// postprocessing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0030;
composer.addPass(rgbShiftPass);

// lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

let model;

// HDRI environment map loader
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr',
    (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        // scene.background = texture;
        scene.environment = texture;
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% HDRI loaded');
    },
    (error) => {
        console.error('An error happened loading HDRI:', error);
    }
);

// GLTF model loader
const loader = new GLTFLoader();
loader.load(
    '/DamagedHelmet.gltf',
    (gltf) => {
        model = gltf.scene;
        scene.add(model);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('An error happened loading GLTF model:', error);
    }
);


function handlePointerMove(x, y) {
    if (model) {
        const sensitivity = window.innerWidth < 768 ? Math.PI * 1.5 : Math.PI * .5;
        const rotationX = (x / window.innerWidth - .5) * sensitivity;
        const rotationY = (y / window.innerHeight - .5) * sensitivity;
        gsap.to(model.rotation, {
            y: rotationX,
            x: rotationY,
            duration: .9,
            ease: "power2.out"
        });
    }
}

window.addEventListener("mousemove", (e) => {
    handlePointerMove(e.clientX, e.clientY);
});

window.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    handlePointerMove(touch.clientX, touch.clientY);
}, { passive: true });

window.addEventListener("resize", () => {
    const s = getCameraSettings();
    camera.fov = s.fov;
    camera.position.z = s.z;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// render loop
function animate() {
    window.requestAnimationFrame(animate);
    composer.render();
}
animate();