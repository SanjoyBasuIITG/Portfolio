import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Setup basic scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Create a group for the nanoparticles/cells
const particleGroup = new THREE.Group();
scene.add(particleGroup);

// Create particles (representing drug delivery nanoparticles or cells)
const particleGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const particleMaterial = new THREE.MeshPhongMaterial({
    color: 0x4fc3f7, // Light blue
    emissive: 0x0277bd,
    shininess: 100,
    transparent: true,
    opacity: 0.8
});

for (let i = 0; i < 200; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Random positions
    particle.position.x = (Math.random() - 0.5) * 20;
    particle.position.y = (Math.random() - 0.5) * 20;
    particle.position.z = (Math.random() - 0.5) * 20;
    
    // Add custom properties for animation
    particle.userData = {
        speedX: (Math.random() - 0.5) * 0.02,
        speedY: (Math.random() - 0.5) * 0.02,
        speedZ: (Math.random() - 0.5) * 0.02
    };
    
    particleGroup.add(particle);
}

// Add some "DNA" strands or structural elements for bioprinting/mechanobiology
const dnaGeometry = new THREE.TorusGeometry(3, 0.2, 16, 100);
const dnaMaterial = new THREE.MeshPhongMaterial({
    color: 0x81c784, // Light green
    wireframe: true,
    transparent: true,
    opacity: 0.3
});
const dnaMesh = new THREE.Mesh(dnaGeometry, dnaMaterial);
dnaMesh.rotation.x = Math.PI / 2;
scene.add(dnaMesh);


// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

camera.position.z = 10;

// Mouse interaction
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Smooth camera movement based on mouse
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;
    
    particleGroup.rotation.y += 0.002;
    particleGroup.rotation.x += 0.001;
    
    dnaMesh.rotation.z += 0.005;
    dnaMesh.rotation.y += 0.002;
    
    // Move individual particles
    particleGroup.children.forEach(particle => {
        particle.position.x += particle.userData.speedX;
        particle.position.y += particle.userData.speedY;
        particle.position.z += particle.userData.speedZ;
        
        // Bounce off bounds
        if(Math.abs(particle.position.x) > 10) particle.userData.speedX *= -1;
        if(Math.abs(particle.position.y) > 10) particle.userData.speedY *= -1;
        if(Math.abs(particle.position.z) > 10) particle.userData.speedZ *= -1;
    });

    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (-targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

// Handle resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
