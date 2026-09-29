// Three.js 3D Weather Simulation Environment
let scene, camera, renderer;
let activeWeatherState = 'sunny';
let weatherObjects = []; // Holds references to objects created for specific weather states
let groundPlane;

// Animation variables
let sunMesh;
let solarParticles;
let metricBars = [];
let clouds = [];
let raindrops = [];

function init3DWeather() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;
    if (renderer) return; // Already initialized

    // Create Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#052618'); // Match the deep green/dark base theme

    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 400;

    // Create Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 25);
    camera.lookAt(0, 0, 0);

    // Create Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Add Ground Plane (representing fields/grass)
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({ 
        color: 0x051d13, 
        roughness: 0.9, 
        metalness: 0.1 
    });
    groundPlane = new THREE.Mesh(groundGeo, groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -5;
    scene.add(groundPlane);

    // Add Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    scene.add(directionalLight);

    // Add 3D Metric Bars (Equalizer)
    const barCount = 5;
    const barSpacing = 4;
    const startX = -((barCount - 1) * barSpacing) / 2;
    const barColors = [
        0xfbbf24, // Temp: Orange/Amber
        0x3b82f6, // Rain Chance: Blue
        0x10b981, // Humidity: Green
        0x06b6d4, // Wind: Teal
        0x854d0e  // Soil: Brown/Clay
    ];
    const barEmissives = [
        0x78350f, // Temp
        0x1e3a8a, // Rain
        0x064e3b, // Humidity
        0x164e63, // Wind
        0x451a03  // Soil
    ];

    metricBars = [];
    for (let i = 0; i < barCount; i++) {
        const barGeo = new THREE.BoxGeometry(1.2, 10, 1.2);
        const barMat = new THREE.MeshStandardMaterial({
            color: barColors[i],
            emissive: barEmissives[i],
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.85
        });
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set(startX + i * barSpacing, -5, 5); // baseline position
        scene.add(bar);
        metricBars.push(bar);
    }

    // Populate Initial State
    set3DWeatherState('sunny');

    // Start Animation Loop
    animate();

    // Listen for resize
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || !renderer || !camera) return;

    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

function clearWeatherObjects() {
    if (!scene) return;
    weatherObjects.forEach(obj => {
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(mat => mat.dispose());
            } else {
                obj.material.dispose();
            }
        }
    });
    weatherObjects = [];
    clouds = [];
    raindrops = [];
    sunMesh = null;
    solarParticles = null;
}

function set3DWeatherState(state) {
    activeWeatherState = state;
    if (!scene) return;

    clearWeatherObjects();

    // Adjust scene background and ambient light dynamically based on state
    if (state === 'sunny') {
        scene.background = new THREE.Color('#052618');
        scene.fog = null;
        setupSunnyState();
    } else if (state === 'clouds') {
        scene.background = new THREE.Color('#14221c');
        scene.fog = new THREE.FogExp2('#14221c', 0.035);
        setupCloudsState();
    } else if (state === 'rain') {
        scene.background = new THREE.Color('#0c1411');
        scene.fog = new THREE.FogExp2('#0c1411', 0.05);
        setupRainState();
    }
}

// ==================== SUNNY STATE ====================
function setupSunnyState() {
    // 1. Emissive Solar Mesh (Sun)
    const sunGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        colorWrite: true
    });
    sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(0, 8, -5);
    scene.add(sunMesh);
    weatherObjects.push(sunMesh);

    // Add a glowing core overlay
    const sunCoreGeo = new THREE.SphereGeometry(3.6, 16, 16);
    const sunCoreMat = new THREE.MeshBasicMaterial({
        color: 0xffe082,
        transparent: true,
        opacity: 0.35,
        wireframe: true
    });
    const sunCore = new THREE.Mesh(sunCoreGeo, sunCoreMat);
    sunMesh.add(sunCore);

    // 2. Solar Particle Field (Atmosphere)
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = [];

    for (let i = 0; i < particleCount; i++) {
        // Random shell around the sun
        const radius = 5 + Math.random() * 8;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);

        positions[i * 3] = sunMesh.position.x + radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = sunMesh.position.y + radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = sunMesh.position.z + radius * Math.cos(phi);

        speeds.push(0.01 + Math.random() * 0.02);
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
        color: 0xfde047,
        size: 0.25,
        transparent: true,
        opacity: 0.7
    });

    solarParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(solarParticles);
    weatherObjects.push(solarParticles);
    solarParticles.userData = { speeds: speeds };

    // Bars are initialized once in init3DWeather to persist across all states
}

// ==================== OVERCAST STATE ====================
function setupCloudsState() {
    // 10-15 volumetric spheres representing clouds drifting
    const cloudCount = 12;
    for (let i = 0; i < cloudCount; i++) {
        const cloudGeo = new THREE.SphereGeometry(3 + Math.random() * 3, 16, 16);
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0x556660,
            roughness: 0.9,
            metalness: 0.1,
            transparent: true,
            opacity: 0.85
        });
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        
        // Random distribution in sky volume
        cloud.position.set(
            -25 + Math.random() * 50,
            5 + Math.random() * 6,
            -15 + Math.random() * 20
        );

        scene.add(cloud);
        weatherObjects.push(cloud);
        clouds.push(cloud);

        // Drift speed and size variation
        cloud.userData = {
            driftSpeed: 0.01 + Math.random() * 0.02,
            floatSpeed: 0.5 + Math.random() * 0.5,
            floatOffset: Math.random() * Math.PI
        };
    }
}

// ==================== RAINY STATE ====================
function setupRainState() {
    // Create soft grey indicator clouds at top
    const cloudsTopCount = 6;
    for (let i = 0; i < cloudsTopCount; i++) {
        const cloudGeo = new THREE.SphereGeometry(4 + Math.random() * 2, 8, 8);
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0x22332c,
            roughness: 0.9,
            transparent: true,
            opacity: 0.9
        });
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set(-15 + Math.random() * 30, 15, -10 + Math.random() * 20);
        scene.add(cloud);
        weatherObjects.push(cloud);
    }

    // Rain state spawns dynamic CylinderGeometry fields
    const rainCount = 180;
    const rainGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4);
    const rainMat = new THREE.MeshBasicMaterial({
        color: 0x5ea3e6,
        transparent: true,
        opacity: 0.5
    });

    for (let i = 0; i < rainCount; i++) {
        const drop = new THREE.Mesh(rainGeo, rainMat);
        // Distribute in sky volume
        drop.position.set(
            -20 + Math.random() * 40,
            -5 + Math.random() * 25,
            -15 + Math.random() * 25
        );
        scene.add(drop);
        weatherObjects.push(drop);
        raindrops.push(drop);

        drop.userData = {
            fallSpeed: 0.3 + Math.random() * 0.25,
            slant: -0.05 + Math.random() * 0.1
        };
    }
}

// ==================== ANIMATION LOOP ====================
function animate(time) {
    requestAnimationFrame(animate);

    const timeSec = (time || 0) * 0.001;

    // 1. Sun rotation & pulsations
    if (sunMesh) {
        sunMesh.rotation.y += 0.005;
        sunMesh.rotation.x += 0.002;
    }

    // 2. Solar particles rotation/wobble
    if (solarParticles) {
        const positions = solarParticles.geometry.attributes.position.array;
        const speeds = solarParticles.userData.speeds;
        for (let i = 0; i < speeds.length; i++) {
            positions[i * 3 + 1] += Math.sin(timeSec + i) * 0.005; // hover up/down
        }
        solarParticles.geometry.attributes.position.needsUpdate = true;
        solarParticles.rotation.y += 0.002;
    }

    // 3. Dynamic 3D Metric Bars mapped to weather indicators
    if (metricBars.length > 0) {
        const metrics = window.currentWeatherMetrics || { temp: 30, rainChance: 40, humidity: 60, wind: 15, soil: 45 };
        const values = [
            metrics.temp,        // Temp (0 to 50 range)
            metrics.rainChance,  // Rain Chance (0 to 100 range)
            metrics.humidity,    // Humidity (0 to 100 range)
            metrics.wind,        // Wind Speed (0 to 50 range)
            metrics.soil         // Soil Moisture (0 to 100 range)
        ];
        const maxVals = [50, 100, 100, 50, 100]; // Normalization dividers
        
        metricBars.forEach((bar, idx) => {
            const val = values[idx];
            const maxVal = maxVals[idx];
            
            // Map value to target height (ranges between 1 and 9 units)
            const targetHeight = 1 + (val / maxVal) * 8;
            
            // Subtle breathing effect to make it feel alive
            const breathing = Math.sin(timeSec * 2.5 + idx) * 0.25;
            const finalHeight = Math.max(0.5, targetHeight + breathing);
            
            bar.scale.set(1, finalHeight / 10, 1);
            // Align the bottom of the column with the ground plane (ground is at y = -5)
            bar.position.y = -5 + finalHeight / 2;
        });
    }

    // 4. Overcast drift
    if (clouds.length > 0) {
        clouds.forEach(cloud => {
            const data = cloud.userData;
            cloud.position.x += data.driftSpeed;
            // Float up and down slightly
            cloud.position.y += Math.sin(timeSec * data.floatSpeed + data.floatOffset) * 0.004;

            // Warp boundary
            if (cloud.position.x > 30) {
                cloud.position.x = -30;
            }
        });
    }

    // 5. Rain drop animation
    if (raindrops.length > 0) {
        raindrops.forEach(drop => {
            const data = drop.userData;
            drop.position.y -= data.fallSpeed;
            drop.position.x += data.slant;

            // Reset back to top if hit ground (y = -5)
            if (drop.position.y < -5) {
                drop.position.y = 20;
                drop.position.x = -20 + Math.random() * 40;
                drop.position.z = -15 + Math.random() * 25;
            }
        });
    }

    // Render Scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Initialise on demand. init3DWeather() is called dynamically by showFeature('weather') in app.js
